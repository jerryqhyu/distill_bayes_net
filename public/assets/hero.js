function hero(curve_div, graph_div) {
    this.div_id = curve_div.attr('id');
    var training = false;
    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
    const optH = tf.train.momentum(param.learning_rate / 10, param.momentum);
    const layer1WeightsMu = tf.variable(tf.randomNormal([1, 10], 0, 0.5));
    const layer1WeightsLogSigma = tf.variable(tf.randomUniform(layer1WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer1BiasMu = tf.variable(tf.zeros([10]));
    const layer1BiasLogSigma = tf.variable(tf.randomUniform(layer1BiasMu.shape, minLogSigma, maxLogSigma));

    const layer2WeightsMu = tf.variable(tf.randomNormal([10, 10], 0, 0.5));
    const layer2WeightsLogSigma = tf.variable(tf.randomUniform(layer2WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer2BiasMu = tf.variable(tf.zeros([10]));
    const layer2BiasLogSigma = tf.variable(tf.randomUniform(layer2BiasMu.shape, minLogSigma, maxLogSigma));

    const layer3WeightsMu = tf.variable(tf.randomNormal([10, 1], 0, 0.5));
    const layer3WeightsLogSigma = tf.variable(tf.randomUniform(layer3WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer3BiasMu = tf.variable(tf.zeros([1]));
    const layer3BiasLogSigma = tf.variable(tf.randomUniform(layer3BiasMu.shape, minLogSigma, maxLogSigma));

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

    function predict(x) {
        return predict(x, 0);
    }

    function predict(x, seed) {
        const layer1Weights = layer1WeightsMu.add(tf.exp(layer1WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer1WeightsMu.shape, 0, 1, 'float32', seed)));
        const layer1Bias = layer1BiasMu.add(tf.exp(layer1BiasLogSigma.add(eps)).mul(tf.randomNormal(layer1BiasMu.shape, 0, 1, 'float32', seed)));
        const layer2Weights = layer2WeightsMu.add(tf.exp(layer2WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer2WeightsMu.shape, 0, 1, 'float32', seed)));
        const layer2Bias = layer2BiasMu.add(tf.exp(layer2BiasLogSigma.add(eps)).mul(tf.randomNormal(layer2BiasMu.shape, 0, 1, 'float32', seed)));
        const layer3Weights = layer3WeightsMu.add(tf.exp(layer3WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer3WeightsMu.shape, 0, 1, 'float32', seed)));
        const layer3Bias = layer3BiasMu.add(tf.exp(layer3BiasLogSigma.add(eps)).mul(tf.randomNormal(layer3BiasMu.shape, 0, 1, 'float32', seed)));

        const layer1 = tf.tidy(() => {
            return x.matMul(layer1Weights).add(layer1Bias).elu(1 / 10);
        });
        const layer2 = tf.tidy(() => {
            return layer1.matMul(layer2Weights).add(layer2Bias).elu(1 / 10);
        });
        return layer2.matMul(layer3Weights).add(layer3Bias);
    }

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.curve_domain_y, false, false);
    var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

    //interval controller
    setup();

    async function train() {
        for (let iter = 0; iter < 4; iter++) {
            optH.minimize(() => {
                const predsYs = predict(tf.tensor2d(valid_xs)); // input N*D
                const lossH = tf.losses.meanSquaredError(predsYs, tf.tensor2d(valid_ys));
                return lossH;
            }, false, [layer1WeightsMu, layer1WeightsLogSigma, layer1BiasMu, layer1BiasLogSigma, layer2WeightsMu, layer2WeightsLogSigma, layer2BiasMu, layer2BiasLogSigma, layer3WeightsMu, layer3WeightsLogSigma, layer3BiasMu, layer3BiasLogSigma]);
        }
        await tf.nextFrame();
    }

    function setup() {
        curve_plotter.add_group("fixed");
        curve_plotter.add_group("float");
        graph_plotter.add_group("fixed");
        graph_plotter.add_group("float");
        plot_train_and_valid_points();
        plot();
    }

    function plot() {
        plot_path();
    }

    function plot_path() {
        var seed = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
        var curves = seed.map(s => {
            var d = [];
            predict(tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]), s).dataSync().forEach((y, i) => {
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
            opacity: 0.5,
            id: "#float"
        });
    }

    function plot_train_and_valid_points() {
        curve_plotter.plot_points(validation_points_data, {
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