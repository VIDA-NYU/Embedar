import argparse
import sys
import dataset
import torch
import tqdm
import numpy as np
import os
import random
import pdb
import cv2
from sklearn.metrics import pairwise_distances

from models import Omnivore, SlowFast, Avion, Clip, ObjDetector
import utils

SEED_VALUE = 1109

def extract_metrics(window, metrics, index):
  frame = cv2.cvtColor(window[index], cv2.COLOR_RGB2HLS)
  metrics.setdefault("hls_l_avg", []).append(np.mean(frame[:, :, 1]))

def extract_features(args, replace = False, use_medoid = True):
  random.seed(SEED_VALUE)
  np.random.seed(SEED_VALUE)
  torch.manual_seed(SEED_VALUE)  

  data = dataset.LoadVideoFrames(args.source_path)

  omni = Omnivore().to("cuda")
  slowfast = SlowFast().to("cuda")
  avion = Avion().to("cuda")
  clip = Clip(utils.clip_download_root).to("cuda")
  obj_detector = None if args.obj_detect is None else ObjDetector(args.obj_detect).to("cuda")

  progress = tqdm.tqdm(bar_format='{desc}{percentage:3.0f}%|{bar:50}{r_bar}')

  for idx in range(len(data)):
    progress.set_description("Video {}/{} ".format(idx + 1, len(data)))
    progress.reset()
    progress.set_postfix({"doing":["loading"], "done": []})

    video, fps, limits, windows = data[idx]
    
    progress.reset(total = len(windows))

    omni_features = []
    slowfast_features = []
    avion_features = []
    obj_detected_bbox = []
    obj_detected_conf = []
    obj_detected_class = []
    window_medoid = []
    metrics = {}

    feature_path = os.path.join(args.output_path, "{}-features.npz".format(video))

    if not os.path.isfile(feature_path) or replace:
      for limit, window in zip(limits, windows):
        progress.update(1)
        progress.set_postfix({"doing":["omnivore"], "done": ["loading"]})

        #============================ OMNIVORE ============================#
        omni_window = omni.prepare_window(window)
        omni_features.append(omni(omni_window))  #shape = 1024
        torch.cuda.empty_cache()

        progress.set_postfix({"doing":["slowfast"], "done": ["loading", "omnivore"]})

        #============================ SLOWFAST ============================#
        slowfast_window = slowfast.prepare_window(window)
        slowfast_features.append(slowfast(slowfast_window)) #shape = 1600
        torch.cuda.empty_cache()   

        progress.set_postfix({"doing":["avion"], "done": ["loading", "omnivore", "slowfast"]})

        #============================ AVION ============================#
        avion_window = avion.prepare_window(window)

        ## https://github.com/TimDettmers/bitsandbytes/issues/240#issuecomment-1621684878
        with torch.autocast("cuda"):
          avion_features.append(avion(avion_window)) #shape = 3806
        
        torch.cuda.empty_cache()

        progress.set_postfix({"doing":["clip"], "done": ["loading", "omnivore", "slowfast", "avion"]})

        #============================ FRAME-MEDOID TO REPRESENT THE WINDOW ============================#        
        ##frame_indices values start with 1 
        frame_indices = [i for i in range(limit[0], limit[1] + 1)]
        clip_medoid = 0

        if len(frame_indices) > 1:
          if limit[0] == 1:
            clip_window = clip.prepare_window(window[-len(frame_indices):])
          else:
            clip_window = clip.prepare_window(window[:len(frame_indices)])

          clip_features = clip(clip_window) #shape = 512
          clip_centroid = clip_features.mean(axis = 0)
          clip_features = np.append(clip_centroid[None], clip_features, axis = 0)
          #distances from the average centroid
          dist_clip     = pairwise_distances(clip_features, metric = "cosine")
          clip_medoid   = dist_clip[0].argsort()[1] - 1

        window_medoid.append(frame_indices[clip_medoid])
        torch.cuda.empty_cache()

        progress.set_postfix({"doing":[], "done": ["loading", "omnivore", "slowfast", "avion", "clip"]})

        #============================ YOLO ============================#
        frame_index = frame_indices[clip_medoid] - limit[0] if use_medoid else -1

        if obj_detector is not None:
          progress.set_postfix({"doing":["object"], "done": ["loading", "omnivore", "slowfast", "avion", "clip"]})

          obj_window = obj_detector.prepare_window(window[frame_index])
          conf, bbox, classes = obj_detector(obj_window)
          obj_detected_conf.append(conf)
          obj_detected_bbox.append(bbox)
          obj_detected_class.append(classes)
          torch.cuda.empty_cache()

          progress.set_postfix({"doing":[], "done": ["loading", "omnivore", "slowfast", "avion", "clip", "object"]})

        #============================ METRICS ============================#        
        extract_metrics(window, metrics, frame_index)

      if idx < len(data) - 1:
        print("")

      ##load with allow_pickle=True because of dtype=object
      np.savez(feature_path,
                fps=fps,
                window_limit=limits,
                window_medoid=np.array(window_medoid),
                omnivore=np.array(omni_features), 
                slowfast=np.array(slowfast_features), 
                avion=np.array(avion_features),
                objects_conf=np.array(obj_detected_conf, dtype=object),
                objects_bbox=np.array(obj_detected_bbox, dtype=object),
                **metrics
                )

  progress.close()    

def main(*args):
  parser = argparse.ArgumentParser(description="Conversion of dataset structure")
  parser.add_argument("-s", "--source", help = "Videos folder", dest = "source_path", required = True)
  parser.add_argument("-o", "--output", help = "Output feature path", dest = "output_path", required = True)
  parser.add_argument("-d", "--detector", help = "Object detector", dest = "obj_detect", required = False, default = None)

  parser.set_defaults(func = extract_features)
  
  args = parser.parse_args()
  args.func(args)    

if __name__ == "__main__":
  main(*sys.argv[1:])