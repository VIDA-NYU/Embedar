
import os
import glob
import pdb
import math
import cv2
import moviepy.editor as mpy
from enum import IntEnum

class WINDOW_INIT_TYPE(IntEnum): 
  ### video  |-----------------------------------------------------|
  ### window |-------------|
  HEAD  = 0       
  ### video         |-----------------------------------------------------|
  ### window |-------------|  
  CENTER = 1
  ### video                |-----------------------------------------------------|
  ### window |-------------|    
  TAIL   = 2

class VideoFileClip_Adapter():
  def __init__(self, path):
    super().__init__()  

    self.frame_cache = []
    self.video = mpy.VideoFileClip(path)
    self.video_iter = self.video.iter_frames()
    self.n_frame = math.ceil(self.video.duration * self.video.fps)

  def __getitem__(self, index):
    if isinstance(index, slice):
      return [ self.__getitem__(i) for i in range(index.start, index.stop, 1 if index.step is None else index.step) ]
    elif index >= 0 and index < self.n_frame:
      if len(self.frame_cache) > 0 and index < len(self.frame_cache):
        return self.frame_cache[index]
      
      while True:
        ##Movipy returns images with RGB order
        frame = next(self.video_iter)
        self.frame_cache.append(frame)

        if index == len(self.frame_cache) - 1:
          return frame
    else:
      raise IndexError('list index out of range')

class LoadVideoFrames():
  def __init__(self, path, window_size = 2, hop_size = 0.5, w_type = WINDOW_INIT_TYPE.TAIL):
    self.window_size = window_size   #seconds
    self.hop_size = hop_size         #percentage of seconds
    self.window_init_type = w_type

    self.videos = [ vd for vd in glob.glob(os.path.join(path, "*")) ]
    self.videos.sort()

  def __len__(self):
    return len(self.videos)

  def __get_windows__(self, video):
    n_frame = math.ceil(video.duration * video.fps)    

    stop_frame  = 1
    start_frame = int(stop_frame - video.fps * self.window_size + 1)

    if self.window_init_type == WINDOW_INIT_TYPE.HEAD:
      start_frame = 1 
      stop_frame  = int(start_frame + video.fps * self.window_size - 1)
    elif self.window_init_type == WINDOW_INIT_TYPE.CENTER:  
      stop_frame  = 1 + int(video.fps * self.window_size / 2) 
      start_frame = int(stop_frame - video.fps * self.window_size + 1)

    last_window = False
    video_windows = []
    count_limit_out = 0

    while count_limit_out < 2:
      video_windows.append({
        ##always starts with 1
        "start_frame": max(start_frame, 1), 
        "stop_frame": stop_frame,
        "window_frame_size": int(video.fps * self.window_size),
        "last_window": last_window
      })

      start_frame += int(video.fps * self.window_size * self.hop_size)
      stop_frame   = min(int(start_frame - 1 + video.fps * self.window_size), n_frame)

      if stop_frame == n_frame:
        last_window = True
        count_limit_out += 1

    return video_windows, int(video.fps)

  def __getitem__(self, index):
    video_adapt = VideoFileClip_Adapter(self.videos[index])
    window_limit, video_fps = self.__get_windows__(video_adapt.video)
    window_idx = 0
    video_windows = []

    while window_idx < len(window_limit):
      window = window_limit[window_idx]
      window_frames = video_adapt[ window["start_frame"] - 1 : window["stop_frame"] ]

      #Applies last-frame padding AFTER the window
      if window["last_window"]:
        pad_frame     = window_frames[-1]
        window_frames = window_frames + [pad_frame] * (window["window_frame_size"] - len(window_frames))
      #Applies first-frame padding BEFORE the window  
      else:  
        pad_frame     = window_frames[0]
        window_frames = [pad_frame] * (window["window_frame_size"] - len(window_frames)) + window_frames

      video_windows.append(window_frames)      
      window_idx += 1

    window_limit = [ [vw["start_frame"], vw["stop_frame"]]  for vw in window_limit ]
    video_id = os.path.basename(self.videos[index])
    video_id = video_id.split(".")[0]

    return video_id, video_fps, window_limit, video_windows