function bnnMNIST(train_loss_div) {
    this.div_id = train_loss_div.attr('id');
	var training = false;
    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
    const data = new mnistData();
    const layer1WeightsMu = tf.variable(tf.randomNormal([1, 10], 0, 1));
    const layer1WeightsLogSigma = tf.variable(tf.randomUniform(layer1WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer1BiasMu = tf.variable(tf.zeros([10]));
    const layer1BiasLogSigma = tf.variable(tf.randomUniform(layer1BiasMu.shape, minLogSigma, maxLogSigma));
    const layer2WeightsMu = tf.variable(tf.randomNormal([10, 10], 0, 1));
    const layer2WeightsLogSigma = tf.variable(tf.randomUniform(layer2WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer2BiasMu = tf.variable(tf.zeros([10]));
    const layer2BiasLogSigma = tf.variable(tf.randomUniform(layer2BiasMu.shape, minLogSigma, maxLogSigma));
    const layer3WeightsMu = tf.variable(tf.randomNormal([10, 1], 0, 1));
    const layer3WeightsLogSigma = tf.variable(tf.randomUniform(layer3WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer3BiasMu = tf.variable(tf.zeros([1]));
    const layer3BiasLogSigma = tf.variable(tf.randomUniform(layer3BiasMu.shape, minLogSigma, maxLogSigma));
    const optimizer = tf.train.adam(param.learning_rate);

    async function start() {
        await data.load();
        training = true;
        for (var i = 0; i < 100; i++) {
            await train();
        }
    }

    function sample() {
        const batch = data.nextTestBatch(1);
        // plot the mnist image

        var s = tf.randomUniform([5, 1], -100, 100).dataSync();
        const e1 = predict(batch.xs, s[0]);
        const e2 = predict(batch.xs, s[1]);
        const e3 = predict(batch.xs, s[2]);
        const e4 = predict(batch.xs, s[3]);
        const e5 = predict(batch.xs, s[4]);
        // plot/write the predictions
    }

    function stop() {
        training = false;
    }

    function is_running() {
        return training;
    }

    function predict(x, seed) {
        return tf.tidy(() => {
            const layer1Weights = layer1WeightsMu.add(tf.exp(layer1WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer1WeightsMu.shape, 0, 1, 'float32', seed)));
            const layer1Bias = layer1BiasMu.add(tf.exp(layer1BiasLogSigma.add(eps)).mul(tf.randomNormal(layer1BiasMu.shape, 0, 1, 'float32', seed)));
            const layer2Weights = layer2WeightsMu.add(tf.exp(layer2WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer2WeightsMu.shape, 0, 1, 'float32', seed)));
            const layer2Bias = layer2BiasMu.add(tf.exp(layer2BiasLogSigma.add(eps)).mul(tf.randomNormal(layer2BiasMu.shape, 0, 1, 'float32', seed)));
            const layer3Weights = layer3WeightsMu.add(tf.exp(layer3WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer3WeightsMu.shape, 0, 1, 'float32', seed)));
            const layer3Bias = layer3BiasMu.add(tf.exp(layer3BiasLogSigma.add(eps)).mul(tf.randomNormal(layer3BiasMu.shape, 0, 1, 'float32', seed)));
            const l1 = tf.exp(x.matMul(layer1Weights).add(layer1Bias).pow(tf.scalar(2)).mul(tf.scalar(-1)));
            const l2 = tf.exp(l1.matMul(layer2Weights).add(layer2Bias).pow(tf.scalar(2)).mul(tf.scalar(-1)));
            return l2.matMul(layer3Weights).add(layer3Bias);
        });
    }

    async function train() {
        optimizer.minimize(() => {
            return tf.tidy(() => {
                const batch = data.nextTrainBatch(10);
                var s = tf.randomUniform([5, 1], -100, 100).dataSync();
                const logLik = tf.stack([
                    tf.losses.meanSquaredError(predict(batch.xs, s[0]), batch.labels),
                    tf.losses.meanSquaredError(predict(batch.xs, s[1]), batch.labels),
                    tf.losses.meanSquaredError(predict(batch.xs, s[2]), batch.labels),
                    tf.losses.meanSquaredError(predict(batch.xs, s[3]), batch.labels),
                    tf.losses.meanSquaredError(predict(batch.xs, s[4]), batch.labels)
                ]).mean().div(tf.scalar(1e-6));
                const lowerBound = logLik.add(entropy().mul(tf.scalar(-1)));
                return lowerBound;
            });
        });
        await tf.nextFrame();
    }

    return {
        start: start,
        sample: sample,
        stop: stop,
        is_running: is_running,
    };
}
