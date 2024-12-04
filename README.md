# ARModelDebugger

ARModelDebugger an interactive analytics tool designed to help AR system developers explore and understand not only the final outputs but also the complex embedding spaces of models used in AR guidance systems.
![System screen](https://github.com/VIDA-NYU/ARModelDebugger/blob/tool_without_predicted_labels/imgs/ARModelDebugger_system.png)


## Install

~~~~
npm install
npx webpack
python -m http.server
~~~~

## Data Setup

To set up the required data for ARModelDebugger, follow these steps:

1. Unzip the `data.zip` file in the same directory where it is located.

2. Within the unzipped `data` folder, create a new folder named `medoid_frame`.

3. Inside the `medoid_frame` folder, organize the images (frames) according to each session in the BBN dataset. If you don't have access to the sessions' frames, please contact [s.castelo@nyu.edu](mailto:s.castelo@nyu.edu) to obtain a copy of this.

   The folder structure within the `medoid_frame` folder should be organized as follows:
   ```
    ├── ...
    ├──data                   
    │  ├── medoid_frame        # Folder containing all images                
    |  |  ├── [skill_ID]   
    |  |  |  |  ├── A8-1_w1_f1.jpg
    |  |  |  |  ...   
    └────────────────────────────────────────────────────────────────────────────
    ```
