// stolen from google demo
function mnistData() {
    var shuffledTrainIndex = 0;
    var shuffledTestIndex = 0;
    const IMAGE_SIZE = 784;
    const NUM_CLASSES = 10;
    const NUM_DATASET_ELEMENTS = 65000;

    const TRAIN_TEST_RATIO = 5 / 6;

    const NUM_TRAIN_ELEMENTS = Math.floor(TRAIN_TEST_RATIO * NUM_DATASET_ELEMENTS);
    const NUM_TEST_ELEMENTS = NUM_DATASET_ELEMENTS - NUM_TRAIN_ELEMENTS;

    const MNIST_IMAGES_SPRITE_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
    const MNIST_LABELS_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

    var datasetImages;
    var datasetLabels;
    var trainIndices;
    var testIndices;
    var trainImages;
    var testImages;
    var trainLabels;
    var testLabels;

    async function load() {
        // Make a request for the MNIST sprited image.
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const imgRequest = new Promise((resolve, reject) => {
            img.crossOrigin = '';
            img.onload = () => {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;

                const datasetBytesBuffer =
                    new ArrayBuffer(NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4);

                const chunkSize = 5000;
                canvas.width = img.width;
                canvas.height = chunkSize;

                for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) {
                    const datasetBytesView = new Float32Array(
                        datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4,
                        IMAGE_SIZE * chunkSize);
                    ctx.drawImage(
                        img, 0, i * chunkSize, img.width, chunkSize, 0, 0, img.width,
                        chunkSize);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    for (let j = 0; j < imageData.data.length / 4; j++) {
                        // All channels hold an equal value since the image is grayscale, so
                        // just read the red channel.
                        datasetBytesView[j] = imageData.data[j * 4] / 255;
                    }
                }
                datasetImages = new Float32Array(datasetBytesBuffer);

                resolve();
            };
            img.src = MNIST_IMAGES_SPRITE_PATH;
        });

        const labelsRequest = fetch(MNIST_LABELS_PATH);
        const [imgResponse, labelsResponse] =
        await Promise.all([imgRequest, labelsRequest]);

        datasetLabels = new Uint8Array(await labelsResponse.arrayBuffer());

        // Create shuffled indices into the train/test set for when we select a
        // random dataset element for training / validation.
        trainIndices = tf.util.createShuffledIndices(NUM_TRAIN_ELEMENTS);
        testIndices = tf.util.createShuffledIndices(NUM_TEST_ELEMENTS);

        // Slice the the images and labels into train and test sets.
        trainImages =
            datasetImages.slice(0, IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
        testImages = datasetImages.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
        trainLabels =
            datasetLabels.slice(0, NUM_CLASSES * NUM_TRAIN_ELEMENTS);
        testLabels =
            datasetLabels.slice(NUM_CLASSES * NUM_TRAIN_ELEMENTS);
    }

    function nextTrainBatch(batchSize) {
        return nextBatch(
            batchSize, [trainImages, trainLabels], () => {
                shuffledTrainIndex =
                    (shuffledTrainIndex + 1) % trainIndices.length;
                return trainIndices[shuffledTrainIndex];
            });
    }

    function nextTestBatch(batchSize) {
        return nextBatch(batchSize, [testImages, testLabels], () => {
            shuffledTestIndex =
                (shuffledTestIndex + 1) % testIndices.length;
            return testIndices[shuffledTestIndex];
        });
    }

    function nextBatch(batchSize, data, index) {
        const batchImagesArray = new Float32Array(batchSize * IMAGE_SIZE);
        const batchLabelsArray = new Uint8Array(batchSize * NUM_CLASSES);

        for (let i = 0; i < batchSize; i++) {
            const idx = index();

            const image =
                data[0].slice(idx * IMAGE_SIZE, idx * IMAGE_SIZE + IMAGE_SIZE);
            batchImagesArray.set(image, i * IMAGE_SIZE);

            const label =
                data[1].slice(idx * NUM_CLASSES, idx * NUM_CLASSES + NUM_CLASSES);
            batchLabelsArray.set(label, i * NUM_CLASSES);
        }

        const xs = tf.tensor2d(batchImagesArray, [batchSize, IMAGE_SIZE]);
        const labels = tf.tensor2d(batchLabelsArray, [batchSize, NUM_CLASSES]);

        return {
            xs,
            labels
        };
    }

    return {load: load, nextTrainBatch: nextTrainBatch, nextTestBatch: nextTestBatch}
}