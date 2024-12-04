

## **Requirements**

1. All test were performed with Cuda 12.1.1, cuDNN 8.9, and one of following GPUs: A100 or H100

2. Clone the repo and install the requirements

  ```
    git clone --recursive https://github.com/VIDA-NYU/ARModelDebugger.git
    cd ARModelDebugger/feature_extraction    
    pip install -r requirements.txt
  ```

3. Manually installing [Detectron2](https://github.com/facebookresearch/detectron2)

  ```
  pip install git+https://github.com/facebookresearch/detectron2.git
  ```

> [!NOTE] 
> The package setup.py uses torch but doesn't install it.  

4. Manually installing [SlowFast](https://github.com/facebookresearch/SlowFast)

  ```
    ##clone the repo
    cd ARModelDebugger/feature_extraction
    git clone https://github.com/facebookresearch/SlowFast.git

    ##apply some patches
    patch SlowFast/setup.py patches/slowfast-setup.patch

    ##install
    cd SlowFast && pip install -e .

    ##download the model weights for test: Kinetics/c2/SLOWFAST_8x8_R50
    wget -c https://dl.fbaipublicfiles.com/pyslowfast/model_zoo/kinetics400/SLOWFAST_8x8_R50.pkl
    cd -
  ```
> [!NOTE] 
> We should fix issues of its setup.py before install the package.

5. Manually installing [Avion](https://github.com/zhaoyue-zephyrus/AVION)
  ```
  ##System dependencies
  sudo apt install -y ffmpeg libavcodec-dev libavfilter-dev libavformat-dev libavutil-dev

  ##clone the repo
  cd ARModelDebugger/feature_extraction
  git clone https://github.com/zhaoyue-zephyrus/AVION.git

  ##create needed files and apply some patches
  cp patches/avion-setup.py AVION/setup.py
  touch AVION/avion/__init__.py
  patch AVION/avion/models/transformer.py patches/avion-models-transformer.patch
  patch AVION/requirements.txt patches/avion-requirements.patch

  ##download, build, and install decord requirement
  cd AVION/third_party
  git clone --recursive https://github.com/zhaoyue-zephyrus/decord-dev.git decord
  cd decord && mkdir build && cd build
  cmake .. -DUSE_CUDA=0 -DCMAKE_BUILD_TYPE=Release
  make
  cd ../python && pip install -e .

  ##install other requirements
  cd ../../../
  pip install -r requirements.txt
  
  ##install
  pip install -e .

  ##download the model weights for test: EK-100 Action Recognition (CLS), ViT-L
  ##https://github.com/zhaoyue-zephyrus/AVION/blob/main/docs/MODEL_ZOO.md
  wget https://utexas.box.com/shared/static/crnqo9bu0owtfz4yc1yqf8hz6g0ze39b.pt -O avion_finetune_cls_lavila_vitl_best.pt
  cd ../
 ```

> [!NOTE] 
> If you have any problem, check the Avion [troubleshooting section](https://github.com/zhaoyue-zephyrus/AVION/blob/main/docs/INSTALL.md)
> or [decord](https://github.com/dmlc/decord?tab=readme-ov-file#installation) (an Avion requirement)

## **Usage**

1. Place all MP4 files inside the same folder

2. The *main.py* has the following parameters:
```python
  -s  Videos folder (required)
  -o  Output feature path (required)
  -d  Yolo weights for object detection
```

3. Running examples:
  ```
    python main.py -s /path/to/folder/with/mp4/files -o /path/to/folder/with/output/features
  ```  

  ```
    python main.py -s /path/to/folder/with/mp4/files -o /path/to/folder/with/output/features -d /path/to/yolo/model
  ```  

## **Code structure**
  
1. Main code: `main.py` (function *extract_features*)
2. Dataloader: `dataset.py` (method *__getitem\__*)
3. Models: `models.py`

    
