function bnnMNIST(train_loss_div, pred_div) {
    this.div_id = train_loss_div.attr('id');
    var training = false;
    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
    const data = new mnistData();

    const layer1WeightsMu = tf.variable(tf.randomNormal([784, 32], 0, 0.05));
    const layer1WeightsLogSigma = tf.variable(tf.randomUniform(layer1WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer1BiasMu = tf.variable(tf.zeros([32]));
    const layer1BiasLogSigma = tf.variable(tf.randomUniform(layer1BiasMu.shape, minLogSigma, maxLogSigma));
    const layer2WeightsMu = tf.variable(tf.randomNormal([32, 32], 0, 0.05));
    const layer2WeightsLogSigma = tf.variable(tf.randomUniform(layer2WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer2BiasMu = tf.variable(tf.zeros([32]));
    const layer2BiasLogSigma = tf.variable(tf.randomUniform(layer2BiasMu.shape, minLogSigma, maxLogSigma));
    const layer3WeightsMu = tf.variable(tf.randomNormal([32, 10], 0, 0.05));
    const layer3WeightsLogSigma = tf.variable(tf.randomUniform(layer3WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer3BiasMu = tf.variable(tf.zeros([10]));
    const layer3BiasLogSigma = tf.variable(tf.randomUniform(layer3BiasMu.shape, minLogSigma, maxLogSigma));

    const optimizer = tf.train.adam(0.005);

    const canvas = train_loss_div.append("canvas")
                    .attr("width", 280)
                    .attr("height", 280);
   canvas.node().getContext("2d").scale(10, 10);
        
  

    async function start() {
        pred_div.text("training");
        await data.load();
        training = true;
        for (var i = 0; i < 250; i++) {
            pred_div.text(i+"/250");
            await train();
        }
        pred_div.text("done");
    }

    function sample() {
        // plot the mnist image
        tf.tidy(() => {
            const batch = data.nextTestBatch(1);
            const image = batch.xs.slice([0, 0], [1, batch.xs.shape[1]]);
            draw(image.flatten(), canvas.node().getContext("2d"));
            var s = tf.randomUniform([5, 1], -100, 100).dataSync();
            const e1 = predict(batch.xs, s[0]);
            const e2 = predict(batch.xs, s[1]);
            const e3 = predict(batch.xs, s[2]);
            const e4 = predict(batch.xs, s[3]);
            const e5 = predict(batch.xs, s[4]);
            const pred = tf.stack([e1, e2, e3, e4, e5]).round().mul(tf.range(0, 10, 1)).squeeze().sum(1);
            pred_div.text(pred.dataSync());
        });
    }

    function stop() {
        training = false;
    }

    function is_running() {
        return training;
    }

    function predict(x, seed) {
        return tf.tidy(() => {
            const layer1Weights = layer1WeightsMu.add(tf.exp(layer1WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer1WeightsMu.shape, 0, 0.05, 'float32', seed)));
            const layer1Bias = layer1BiasMu.add(tf.exp(layer1BiasLogSigma.add(eps)).mul(tf.randomNormal(layer1BiasMu.shape, 0, 0.05, 'float32', seed)));
            const layer2Weights = layer2WeightsMu.add(tf.exp(layer2WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer2WeightsMu.shape, 0, 0.05, 'float32', seed)));
            const layer2Bias = layer2BiasMu.add(tf.exp(layer2BiasLogSigma.add(eps)).mul(tf.randomNormal(layer2BiasMu.shape, 0, 0.05, 'float32', seed)));
            const layer3Weights = layer3WeightsMu.add(tf.exp(layer3WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer3WeightsMu.shape, 0, 0.05, 'float32', seed)));
            const layer3Bias = layer3BiasMu.add(tf.exp(layer3BiasLogSigma.add(eps)).mul(tf.randomNormal(layer3BiasMu.shape, 0, 0.05, 'float32', seed)));
            const l1 = x.matMul(layer1Weights).add(layer1Bias).relu();
            const l2 = l1.matMul(layer2Weights).add(layer2Bias).relu();
            return l2.matMul(layer3Weights).add(layer3Bias).softmax();
        });
    }

    function entropy() {
        var D = layer1WeightsLogSigma.shape[0] * layer1WeightsLogSigma.shape[1] + layer1BiasLogSigma.shape[0] +
                layer2WeightsLogSigma.shape[0] * layer2WeightsLogSigma.shape[1] + layer2BiasLogSigma.shape[0] +
                layer3WeightsLogSigma.shape[0] * layer3WeightsLogSigma.shape[1] + layer3BiasLogSigma.shape[0];
        return tf.tidy(() => {
            const onepluslogtwopi = tf.scalar(1).add(tf.log(tf.scalar(2 * Math.PI)));
            const halfD = tf.scalar(0.5 * D);
            const layer1entropy = tf.sum(layer1WeightsLogSigma).add(tf.sum(layer1BiasLogSigma));
            const layer2entropy = tf.sum(layer2WeightsLogSigma).add(tf.sum(layer2BiasLogSigma));
            const layer3entropy = tf.sum(layer3WeightsLogSigma).add(tf.sum(layer3BiasLogSigma));
            return halfD.mul(onepluslogtwopi).mul(layer1entropy.add(layer2entropy).add(layer3entropy));
        });
    }

    async function train() {
        optimizer.minimize(() => {
            return tf.tidy(() => {
                const batch = data.nextTrainBatch(8);
                var s = tf.randomUniform([10, 1], -100, 100).dataSync();
                const logLik = tf.stack([
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[0])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[1])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[2])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[3])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[4])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[5])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[6])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[7])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[8])).mean(),
                    tf.losses.softmaxCrossEntropy(batch.labels, predict(batch.xs, s[9])).mean(),
                ]).sum().div(tf.scalar(1e-10));
                const lowerBound = logLik.add(entropy().mul(tf.scalar(-1)));
                lowerBound.print();
                return lowerBound;
            });
        });
        await tf.nextFrame();
    }

    function draw(image, ctx) {
        const height = 28;
        const width = 28;
        const imageData = new ImageData(width, height);
        const data = image.dataSync();
        for (let i = 0; i < height * width; ++i) {
            const j = i * 4;
            imageData.data[j + 0] = data[i] * 255;
            imageData.data[j + 1] = data[i] * 255;
            imageData.data[j + 2] = data[i] * 255;
            imageData.data[j + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        ctx.drawImage(ctx.canvas, 0, 0);
    }

    return {
        start: start,
        sample: sample,
        stop: stop,
        is_running: is_running,
    };
}