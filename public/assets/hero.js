function hero(curve_div, graph_div) {
    this.div_id = curve_div.attr('id');
    var training = false;
    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;

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

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.hero_domain_y, false, false);
    var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

    const train_x = tf.randomNormal([20, 1], 0, 1, 'float32', 193);
    const train_y = tf.sin(train_x).add(tf.randomNormal([20, 1], 0, 0.1, 'float32', 193));

    const num_plot_sample = 15;
    const plot_seed = tf.randomNormal([num_plot_sample, 1], 0, 100, 'int32', 111);

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

    function stop() {
        if (training) {
            console.log("stopped");
            training = false;
        }
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
                var s = tf.randomUniform([5, 1], -100, 100).dataSync();
                const logLik = tf.stack([
                    tf.losses.meanSquaredError(predict(train_x, s[0]), train_y),
                    tf.losses.meanSquaredError(predict(train_x, s[1]), train_y),
                    tf.losses.meanSquaredError(predict(train_x, s[2]), train_y),
                    tf.losses.meanSquaredError(predict(train_x, s[3]), train_y),
                    tf.losses.meanSquaredError(predict(train_x, s[4]), train_y)
                ]).sum().div(tf.scalar(5)).div(tf.scalar(1e-5));
                const lowerBound = logLik.add(entropy().mul(tf.scalar(-1)));
                return lowerBound;
            });
        });
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
            return halfD.mul(onepluslogtwopi).mul(layer1entropy.add(layer2entropy).add(layer3entropy));
        });
    }

    function setup() {
        curve_plotter.add_group("float");
        curve_plotter.add_group("fixed");
        graph_plotter.add_group("float");
        graph_plotter.add_group("fixed");
        plot_train_points(curve_plotter, train_x, train_y);
        plot();
    }

    function plot() {
        plot_path(curve_plotter, plot_seed);
    }

    function plot_path(plotter, seeds) {
        var curves = tf.tidy(() => {
            return seeds.unstack().map(s => {
                var d = [];
                var pred = predict(tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]), s).dataSync();
                pred.forEach((y, i) => {
                    d.push({
                        x: curve_x_extended[i],
                        y: y
                    });
                })
                return d;
            })
        });
        plotter.plot_path(curves, {
            color: "darkorange",
            width: 1,
            opacity: 0.75,
            id: "#float"
        });
    }

    function plot_train_points(plotter, x, y) {
        var xs = x.dataSync();
        var ys = y.dataSync();
        var train_points = new Array(xs.length);
        xs.forEach((x, n) => {
            train_points[n] = {
                x: xs[n],
                y: ys[n]
            };
        });
        plotter.plot_points(train_points, {
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
    };
}
