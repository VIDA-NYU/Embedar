# Embedar

Embedar is an interactive visual analytics tool designed to help users explore, compare, and analyze model embedding space
in guidance systems. The tool integrates three interconnected core components: (A) Model Embedding Space Overview, offering interactive
scatter plots and statistical insights for an in-depth understanding of model behavior; (B) Key Frame View, which connects abstract data
representations with concrete actions and objects in the physical environment for deeper exploration; and (C) Event Timeline View, which
aligns multiple time series (steps and average confidence of detected objects) collected during performer sessions along a shared time axis, enabling comparison across sessions and exploration by brushing to update linked views.
![System screen](https://github.com/VIDA-NYU/Embedar/blob/main/imgs/Embedar_system.png)


## Install

~~~~
npm install
npx webpack
python -m http.server
~~~~

## Data Setup

To set up the required data for Embedar, follow these steps:

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
