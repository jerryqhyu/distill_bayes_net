function hero(curve_div, graph_div) {
    this.div_id = curve_div.attr('id');
    var training = false;
    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
    // const optimizer = tf.train.momentum(1e-12, 0.9);
    const optimizer = tf.train.sgd(1e-5);
    const layer1WeightsMu = tf.variable(tf.randomNormal([1, 15], 0, 0.25));
    const layer1WeightsLogSigma = tf.variable(tf.randomUniform(layer1WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer1BiasMu = tf.variable(tf.zeros([15]));
    const layer1BiasLogSigma = tf.variable(tf.randomUniform(layer1BiasMu.shape, minLogSigma, maxLogSigma));

    const layer2WeightsMu = tf.variable(tf.randomNormal([15, 15], 0, 0.25));
    const layer2WeightsLogSigma = tf.variable(tf.randomUniform(layer2WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer2BiasMu = tf.variable(tf.zeros([15]));
    const layer2BiasLogSigma = tf.variable(tf.randomUniform(layer2BiasMu.shape, minLogSigma, maxLogSigma));

    const layer3WeightsMu = tf.variable(tf.randomNormal([15, 1], 0, 0.25));
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
            return x.matMul(layer1Weights).add(layer1Bias).elu(1 / 20);
        });
        const layer2 = tf.tidy(() => {
            return layer1.matMul(layer2Weights).add(layer2Bias).elu(1 / 20);
        });
        return layer2.matMul(layer3Weights).add(layer3Bias);
    }

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.curve_domain_y, false, false);
    var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

    //interval controller
    setup();

    async function train() {
        for (let iter = 0; iter < 1; iter++) {
            optimizer.minimize(() => {
                const logLik = tf.tidy(() => {
                    var s = tf.randomUniform([20, 1], -100, 100).dataSync();
                    const loss1 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[0]), tf.tensor2d(experiment_ys));
                    const loss2 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[1]), tf.tensor2d(experiment_ys));
                    const loss3 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[2]), tf.tensor2d(experiment_ys));
                    const loss4 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[3]), tf.tensor2d(experiment_ys));
                    const loss5 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[4]), tf.tensor2d(experiment_ys));
                    const loss6 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[5]), tf.tensor2d(experiment_ys));
                    const loss7 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[6]), tf.tensor2d(experiment_ys));
                    const loss8 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[7]), tf.tensor2d(experiment_ys));
                    const loss9 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[8]), tf.tensor2d(experiment_ys));
                    const loss10 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[9]), tf.tensor2d(experiment_ys));
                    const loss11 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[10]), tf.tensor2d(experiment_ys));
                    const loss12 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[11]), tf.tensor2d(experiment_ys));
                    const loss13 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[12]), tf.tensor2d(experiment_ys));
                    const loss14 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[13]), tf.tensor2d(experiment_ys));
                    const loss15 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[14]), tf.tensor2d(experiment_ys));
                    const loss16 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[15]), tf.tensor2d(experiment_ys));
                    const loss17 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[16]), tf.tensor2d(experiment_ys));
                    const loss18 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[17]), tf.tensor2d(experiment_ys));
                    const loss19 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[18]), tf.tensor2d(experiment_ys));
                    const loss20 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[19]), tf.tensor2d(experiment_ys));
                    return loss1.add(loss2).add(loss3).add(loss4).add(loss5).add(loss6).add(loss7).add(loss8).add(loss9).add(loss10).add(loss11).add(loss12).add(loss13).add(loss14).add(loss15).add(loss16).add(loss17).add(loss18).add(loss19).add(loss20).div(tf.scalar(20)).div(tf.scalar(1e-4));
                });

                const lowerBound = logLik.add(entropy().mul(tf.scalar(-1)));
                lowerBound.print();
                return lowerBound;
            }, false, [layer1WeightsMu, layer1WeightsLogSigma, layer1BiasMu, layer1BiasLogSigma, layer2WeightsMu, layer2WeightsLogSigma, layer2BiasMu, layer2BiasLogSigma, layer3WeightsMu, layer3WeightsLogSigma, layer3BiasMu, layer3BiasLogSigma]);
        }
        await tf.nextFrame();
    }

    function entropy() {
        const logSigmas = tf.concat([layer1WeightsLogSigma.flatten(), 
            layer1BiasLogSigma.flatten(), 
            layer2WeightsLogSigma.flatten(), 
            layer2BiasLogSigma.flatten(), 
            layer3WeightsLogSigma.flatten(), 
            layer3BiasLogSigma.flatten()
        ]);
        const D = tf.scalar(logSigmas.shape[0]);
        return tf.scalar(0.5).mul(D).mul(tf.scalar(1).add(tf.log(tf.scalar(2.0 * Math.PI)))).add(tf.sum(logSigmas));
    }

    function setup() {
        curve_plotter.add_group("fixed");
        curve_plotter.add_group("float");
        graph_plotter.add_group("fixed");
        graph_plotter.add_group("float");
        plot_train_and_train_points();
        plot();
    }

    function plot() {
        plot_path();
    }

    function plot_path() {
        var seed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
        var curves = seed.map(s => {
            var d = [];
            predict(tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]), s).dataSync().forEach((y, i) => {
                d.push({
                    x: curve_x_extended[i],
                    y: y
                });
            curve_plotter.plot_path(curves, {
                color: "red",
                width: 0.5,
                opacity: 0.75,
                id: "#float"
            });
            }
        });
    }

    function plot_train_and_train_points() {
        curve_plotter.plot_points(experiment_points_date, {
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
