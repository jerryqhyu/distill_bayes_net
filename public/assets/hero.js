function hero(curve_div, graph_div) {
    this.div_id = curve_div.attr('id');
    var training = false;
    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
    // const optimizer = tf.train.momentum(1e-4, 0.85);
    const optimizer = tf.train.adam(0.08);

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

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.hero_domain_y, false, false);
    var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

    //interval controller
    setup();

    async function start() {
        plot();
        training = true;
        while (training) {
            await train();
            plot();
        }
    }

    function stop() { // doesn't work right now
        if (training) {
            console.log("stopped");
            training = false;
        }
    }

    function is_running() {
        return training;
    }

    function reset() {

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
            // const l1 = x.mul(tf.sigmoid(x.matMul(layer1Weights).add(layer1Bias)));
            // const l1 = x.matMul(layer1Weights).add(layer1Bias).elu(0.1);
            // const l2 = l1.matMul(layer2Weights).add(layer2Bias).elu(0.1);
            const l2 = tf.exp(l1.matMul(layer2Weights).add(layer2Bias).pow(tf.scalar(2)).mul(tf.scalar(-1)));
            // const l2 = layer1.mul(tf.sigmoid(layer1.matMul(layer2Weights).add(layer2Bias)));
            return l2.matMul(layer3Weights).add(layer3Bias);
        });
    }

    async function train() {
        for (let iter = 0; iter < 1; iter++) {
            optimizer.minimize(() => {
                const elbo = tf.tidy(() => {
                    var s = tf.randomUniform([5, 1], -100, 100).dataSync();
                    const logLik = tf.stack([tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), 10, s[0]), tf.tensor2d(experiment_ys)),
                    tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[1]), tf.tensor2d(experiment_ys)),
                    tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[2]), tf.tensor2d(experiment_ys)),
                    tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[3]), tf.tensor2d(experiment_ys)),
                    tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[4]), tf.tensor2d(experiment_ys))]).sum().div(tf.scalar(5)).div(tf.scalar(1e-6));
                    const lowerBound = logLik.add(entropy().mul(tf.scalar(-1)));
                    return lowerBound;
                });
                return elbo;
            });
        }
        await tf.nextFrame();
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
            layer1entropy.add(layer2entropy).add(layer3entropy).print();
            return halfD.mul(onepluslogtwopi).mul(layer1entropy.add(layer2entropy).add(layer3entropy));
        });
    }

    function setup() {
        curve_plotter.add_group("float");
        curve_plotter.add_group("fixed");
        graph_plotter.add_group("float");
        graph_plotter.add_group("fixed");
        plot_train_and_train_points();
        plot();
    }

    function plot() {
        plot_path();
    }

    function plot_path() {
        var seed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 19, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25];
        var curves = seed.map(s => {
            var d = [];
            tf.tidy(() => { return predict(tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]), s).dataSync() }).forEach((y, i) => {
                d.push({
                    x: curve_x_extended[i],
                    y: y
                });
            })
            return d;
        });

        curve_plotter.plot_path(curves, {
            color: "darkorange",
            width: 1,
            opacity: 0.75,
            id: "#float"
        });
    }

    function plot_train_and_train_points() {
        curve_plotter.plot_points(experiment_points_data, {
            stroke: "black",
            color: "black",
            size: 3,
            opacity: 0.5,
            id: "#fixed"
        });
    }

    return {
        start: start,
        stop: stop,
        is_running: is_running,
        reset: reset
    };
}