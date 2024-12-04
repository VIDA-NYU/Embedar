
import torch
import torch.nn as nn
import numpy as np
import pdb
from torchvision import transforms
from collections import OrderedDict

from slowfast import models
from slowfast.utils.parser import load_config
from slowfast.config.defaults import assert_and_infer_cfg
from slowfast.utils import checkpoint 
from slowfast.datasets.utils import pack_pathway_output

import avion.models.model_clip as model_clip
from avion.models.utils import inflate_positional_embeds

from ultralytics import YOLO

import clip
from PIL import Image

## https://github.com/facebookresearch/omnivore/blob/main/inference_tutorial.ipynb
class Omnivore(nn.Module):
  def __init__(self):
    super().__init__()

    # model
    self._device = nn.Parameter(torch.empty(0))
    self.model = torch.hub.load("facebookresearch/omnivore:main", model="omnivore_swinB_epic")
    self.model.eval()
    self.max_frame_number = 32

    self.model.heads = nn.Identity()
    self.transform = transforms.Compose([
      transforms.ToPILImage(),
      transforms.Resize(224),
      transforms.CenterCrop(224),
      transforms.ToTensor(),
      transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

  @torch.no_grad()
  def forward(self, x):
    features = self.model(x, input_type="video")

    return features.cpu().detach().squeeze().numpy()
  
  def prepare_window(self, window):
    new_window = torch.from_numpy(np.array([ self.transform(frame / frame.max()) for frame in window  ]))[None]
    frame_idx  = np.linspace(0, new_window.shape[1] - 1, self.max_frame_number).astype('long')
    new_window = new_window[:, frame_idx, :, :, :]
    new_window = torch.permute(new_window, (0, 2, 1, 3, 4)) #Batch x Channel x Time x H x W: Batch = 1, Channel = 3, Time = number of frames per window

    return new_window.to(self._device.device)

def args_hook():
  args = lambda: None
  args.opts = None   
  return args

slowfast_projection = None

def sf_hook(module, input, output):
  global slowfast_projection
  slowfast_projection = output.cpu().detach().reshape(output.shape[0], -1).squeeze().numpy() 

## https://github.com/facebookresearch/SlowFast/
## https://github.com/epic-kitchens/epic-kitchens-slowfast/blob/master/slowfast/datasets/epickitchens.py
class SlowFast(nn.Module):
  def __init__(self):
    super().__init__()

    # model
    self._device = nn.Parameter(torch.empty(0))

    self.cfg = load_config(args_hook(), "SlowFast/configs/Kinetics/SLOWFAST_8x8_R50.yaml")
    self.cfg.NUM_GPUS = 1
    self.cfg.TEST.CHECKPOINT_FILE_PATH = "SlowFast/SLOWFAST_8x8_R50.pkl"
    self.cfg.TEST.CHECKPOINT_TYPE =  "caffe2" ### `caffe2` or `pytorch` (default)
    self.cfg.TEST.NUM_SPATIAL_CROPS = 1
    self.cfg.TRAIN.ENABLE = False
    self.cfg.FREEZE = True
    self.cfg = assert_and_infer_cfg(self.cfg)

    self.model = models.build_model(self.cfg)

    checkpoint.load_test_checkpoint(self.cfg, self.model)
    self.model.eval()

    projection_layer = self.model._modules["head"]._modules["projection"]

    if projection_layer is not None:
      projection_layer.register_forward_hook(sf_hook)    

    self.transform = transforms.Compose([
      transforms.ToPILImage(),      
      transforms.Resize(256),
      transforms.CenterCrop(256),
      transforms.ToTensor(),
      transforms.Normalize(mean=[0.45, 0.45, 0.45], std=[0.225, 0.225, 0.225]),
    ])    

  @torch.no_grad()
  def forward(self, x):
    global slowfast_projection
    slowfast_projection = None
    self.model(x)
  
    return slowfast_projection
  
  def prepare_window(self, window):
    new_window = torch.from_numpy(np.array([ self.transform(frame / frame.max()) for frame in window  ]))
    frame_idx  = np.linspace(0, new_window.shape[1] - 1, self.cfg.DATA.NUM_FRAMES).astype('long')
    new_window = new_window[frame_idx, :, :, :] #SLOWFAST_8x8_R50.pkl needs 32 frames
    new_window = torch.permute(new_window, (1, 0, 2, 3)) #Channel x Time x H x W: Channel = 3, Time = number of frames per window
    new_window = pack_pathway_output(self.cfg, new_window)

    return [ path[None].to(self._device.device) for path in new_window  ]

# https://github.com/zhaoyue-zephyrus/AVION  
class Avion(nn.Module):
  def __init__(self):
    super().__init__()

    model_state = "AVION/avion_finetune_cls_lavila_vitl_best.pt"
    
    self._device = nn.Parameter(torch.empty(0))
    ckpt = torch.load(model_state)
    old_args = ckpt['args']
    self.max_frame_number = old_args.clip_length
    state_dict = OrderedDict()

    for k, v in ckpt['state_dict'].items():
      state_dict[k.replace('module.', '')] = v

#    pdb.set_trace()
    self.model = getattr(model_clip, "CLIP_VITL14")(
      freeze_temperature=True,
      use_grad_checkpointing=old_args.use_grad_checkpointing,
#      context_length=old_args.context_length,
#      vocab_size=old_args.vocab_size,
      patch_dropout=old_args.patch_dropout,
      num_frames=old_args.clip_length,
      drop_path_rate=old_args.drop_path_rate,
      use_fast_conv1=old_args.use_fast_conv1,
      use_flash_attn=old_args.use_flash_attn,
      use_quick_gelu=True,
#      project_embed_dim=old_args.project_embed_dim,
      pretrain_zoo=old_args.norm_style,
      pretrain_path=model_state,
    )

    self.model.logit_scale.requires_grad = False
    state_dict = inflate_positional_embeds(self.model.state_dict(), state_dict, num_frames=old_args.clip_length, load_temporal_fix='bilinear', )

    self.model = model_clip.VideoClassifier(self.model.visual, dropout=old_args.dropout_rate, num_classes=old_args.num_classes)
    self.model.load_state_dict(state_dict, strict=True)
    self.model.eval()

    self.transform = transforms.Compose([
      transforms.ToPILImage(),    
      transforms.Resize(224),
      transforms.CenterCrop(224),
      transforms.ToTensor(),
      transforms.Normalize(mean=[108.3272985, 116.7460125, 104.09373615000001], std=[68.5005327, 66.6321579, 70.32316305]),
    ])      

  @torch.no_grad()
  def forward(self, x):
    features = self.model(x)

    return features.cpu().detach().squeeze().numpy()
  
  def prepare_window(self, window):
    new_window = torch.from_numpy(np.array([ self.transform(frame) for frame in window  ], dtype = np.float32))[None]
    frame_idx  = np.linspace(0, new_window.shape[1] - 1, self.max_frame_number).astype('long')
    new_window = new_window[:, frame_idx, :, :, :]
    new_window = torch.permute(new_window, (0, 2, 1, 3, 4)) #Batch x Channel x Time x H x W: Batch = 1, Channel = 3, Time = number of frames per window

    return new_window.to(self._device.device)

class Clip(nn.Module):
  def __init__(self, download_root = None):
    super().__init__()
    self.model, self.transform = clip.load("ViT-B/16", jit=False, download_root=download_root)
    self._device = nn.Parameter(torch.empty(0))

  @torch.no_grad()    
  def forward(self, x):
    features = self.model.encode_image(x)

    return features.cpu().detach().squeeze().numpy()

  def prepare_window(self, window):
    new_window = torch.from_numpy(np.array([ self.transform(Image.fromarray(frame)) for frame in window  ]))
  
    return new_window.to(self._device.device)

def yolo_eval(a = None):
  return None  

class ObjDetector(nn.Module):
  def __init__(self, path):
    super().__init__()

    self._device = nn.Parameter(torch.empty(0))
    self.yolo = YOLO(path)
    self.yolo.eval = yolo_eval #to work with: torch.multiprocessing.set_start_method('spawn')

  @torch.no_grad()
  def forward(self, x):
    boxes = self.yolo(x, verbose=False)
    classes = boxes[0].names
    boxes = boxes[0].boxes    

    return boxes.conf.cpu().numpy(), boxes.xyxyn.cpu().numpy(), [ classes[ int(box[-1]) ] for box in boxes.data.cpu().numpy().astype(int) ]

  def prepare_window(self, window):  
    return window
