# b8b_synapse

This repository is part of the Beat Byte Bot Ecosystem (B8B).

- B8B Result Analysis: https://github.com/gilpanal/b8b_result_analysis
- B8B Virtuoso: https://github.com/gilpanal/b8b_virtuoso
- B8B Synapse: https://github.com/gilpanal/b8b_synapse

The code is based and adapted from https://github.com/SashiDo/teachablemachine-node

The deep learning models used are TensorFlow models available in Essentia for various (music) audio analysis and classification tasks. These models are in TensorFlow.js format. More info:

- https://mtg.github.io/essentia-labs/news/tensorflow/2020/01/16/tensorflow-models-released/
- https://essentia.upf.edu/models.html#magnatagatune
- Download: https://essentia.upf.edu/models/autotagging/mtt/

## Requirements:
- Node.js (v16)
- For ```@tensorflow/tfjs-node```, please check: https://www.npmjs.com/package/@tensorflow/tfjs-node

## How to run and test it locally:
1. ```git clone https://github.com/gilpanal/b8b_synapse.git```
2. ```cd b8b_synapse```
3. ```npm i```
4. Start the main server by typing ```npm start```
5. Test audio prediction: http://localhost:3000/audio/classify?url=https://freesound.org/data/previews/328/328857_230356-lq.mp3
6. Test image prediction: http://localhost:3000/image/classify?url=https://media-blog.sashido.io/content/images/2020/09/SashiDo_Dog.jpg


#### NOTES:

1.- To switch between Essentia audio models (CNN and VGG), change the value `AUDIO_MODEL_NAME` at `server.js`

2.- To use a different Teachable Machine image model, change the `modelUrl` value from `modelImage` at `server.js`

3.- To use a different `THRESHOLD` value (float from 0 to 1), change it at `audioclassifier.js`