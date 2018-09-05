function svi(curve_div, train_loss_div, valid_loss_div, progress_div, graph_div) {
    this.div_id = curve_div.attr('id');
    var training;

    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
    const layer1WeightsMu = tf.variable(tf.tensor(param.layer1w));
    const layer1WeightsLogSigma = tf.variable(tf.randomUniform(layer1WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer1Bias = tf.tensor(param.layer1b);
    const layer2Weights = tf.tensor(param.layer2w);
    const layer2Bias = tf.tensor(param.layer2b);
    const layer3Weights = tf.tensor(param.layer3w);
    const layer3Bias = tf.tensor(param.layer3b);
    const layer4Weights = tf.tensor(param.layer4w);
    const layer4Bias = tf.tensor(param.layer4b);
    const optimizer = tf.train.adam(param.learning_rate);
    const num_plot_sample = 5;
    const plot_seed = tf.randomNormal([num_plot_sample, 1], 0, 100, 'int32', 111);

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x, param.curve_domain_y, false, false);
    var train_loss_plotter = new Plotter(train_loss_div, param.loss_domain_x, param.loss_domain_y, true, true);
    var valid_loss_plotter = new Plotter(valid_loss_div, param.loss_domain_x, param.loss_domain_y, true, true);
    var progress_plotter = new Plotter(progress_div, param.progress_domain_x, param.progress_domain_y, false, true);
    var graph_plotter = new Plotter(graph_div, [
        0, 1
    ], [
        0, 1
    ], false, false);
    let SCALING_FACTOR = train_loss_plotter.height / param.n;

    var inv_x_scale = d3.scaleLinear().domain([0, train_loss_plotter.width]).range(param.loss_domain_x);
    inv_x_scale.clamp(true);
    var inv_y_scale = d3.scaleLinear().domain([train_loss_plotter.height, 0]).range(param.loss_domain_y);
    inv_y_scale.clamp(true);
    var isocontours = new Array(5);
    for (var i = 0; i < 5; i++) {
        isocontours[i] = new Array(Math.floor((Math.PI * 2 + param.step_size) / param.step_size + 1));
    }
    var pred = new Array(curve_x.length);
    var avg_loss = new Array();

    setup();

    async function start() {
        training = true;
        while (training) {
            await train();
            plot();
        }
    }

    function stop() {
        training = false;
    }

    function is_running() {
        return training;
    }

    function predict(x) {
        predict(x, 0);
    }

    function predict(x, seed) {
        return tf.tidy(() => {
            const layer1Weights = layer1WeightsMu.add(tf.exp(layer1WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer1WeightsMu.shape, 0, 1, 'float32', seed)));
            const l1 = x.matMul(layer1Weights).add(layer1Bias).tanh();
            const l2 = l1.matMul(layer2Weights).add(layer2Bias).tanh();
            const l3 = l2.matMul(layer3Weights).add(layer3Bias).tanh();
            return l3.matMul(layer4Weights).add(layer4Bias);
        });
    }

    async function train() {
        for (let iter = 0; iter < 1; iter++) {
            optimizer.minimize(() => {
                return tf.tidy(() => {
                    var s = tf.randomUniform([5, 1], -100, 100).dataSync();
                    const loss1 = tf.losses.meanSquaredError(predict(tf.tensor2d(train_xs), s[0]), tf.tensor2d(train_ys));
                    const loss2 = tf.losses.meanSquaredError(predict(tf.tensor2d(train_xs), s[1]), tf.tensor2d(train_ys));
                    const loss3 = tf.losses.meanSquaredError(predict(tf.tensor2d(train_xs), s[2]), tf.tensor2d(train_ys));
                    const loss4 = tf.losses.meanSquaredError(predict(tf.tensor2d(train_xs), s[3]), tf.tensor2d(train_ys));
                    const loss5 = tf.losses.meanSquaredError(predict(tf.tensor2d(train_xs), s[4]), tf.tensor2d(train_ys));
                    const logLik = loss1.add(loss2).add(loss3).add(loss4).add(loss5).div(tf.scalar(5)).div(tf.scalar(2e-2));
                    return logLik.add(entropy().mul(tf.scalar(-1)));
                });
            });
        }
        await tf.nextFrame();
    }

    function entropy() {
        return tf.tidy(() => {
            const logSigmas = tf.concat([layer1WeightsLogSigma.flatten()]);
            const D = tf.scalar(logSigmas.shape[0]);
            return tf.scalar(0.5).mul(D).mul(tf.scalar(1).add(tf.log(tf.scalar(2.0 * Math.PI)))).add(tf.sum(logSigmas));
        });
    }

    function setup() {
        curve_plotter.add_group("training_point");
        curve_plotter.add_group("validation_point");
        train_loss_plotter.add_group("contour");
        valid_loss_plotter.add_group("contour");
        progress_plotter.add_group("fixed");

        curve_plotter.add_group("curve");
        train_loss_plotter.add_group("distribution");
        valid_loss_plotter.add_group("distribution");
        curve_plotter.add_group("float");
        train_loss_plotter.add_group("mean");
        valid_loss_plotter.add_group("mean");
        progress_plotter.add_group("float");

        graph_plotter.add_group("float");
        train_loss_plotter.add_group("pts");
        valid_loss_plotter.add_group("pts");

        train_loss_plotter.add_x_axis_label("w1");
        train_loss_plotter.add_y_axis_label("w2");
        valid_loss_plotter.add_x_axis_label("w1");
        valid_loss_plotter.add_y_axis_label("w2");
        initial_plot();
    }


    function plot() {
        plot_avg_curve(curve_plotter, plot_seed);
        plot_avg_loss(progress_plotter, plot_seed);
        plot_path(curve_plotter, plot_seed);
        plot_variational_distribution(train_loss_plotter, valid_loss_plotter);
        plot_weight(train_loss_plotter, valid_loss_plotter, layer1WeightsMu);
        // graph_plotter.plot_neural_net(net, "#float");
    }

    function plot_train_and_valid_points(plotter, train_points, valid_points) {
        plotter.plot_points(train_points, {
            stroke: "red",
            color: "red",
            size: 4,
            opacity: 1,
            id: "#training_point"
        });
        plotter.plot_points(valid_points, {
            stroke: "green",
            color: "green",
            size: 4,
            opacity: 0.5,
            id: "#validation_point"
        });
    }

    function plot_contour(plotter, data, color, contours) {
        plotter.plot_contour(data, {
            n: param.n,
            m: param.m,
            color_scale: color,
            contour_scale: contours,
            id: "#contour"
        });
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
            opacity: 1,
            id: '#curve'
        });
    }

    function plot_weight(train_plotter, valid_plotter, layer1_weight) {
        var p = [{
            x: layer1_weight.dataSync()[0],
            y: layer1_weight.dataSync()[1],
        }];

        train_plotter.plot_points(p, {
            stroke: "black",
            color: "darkslategray",
            size: 4,
            opacity: 0.75,
            transition: 25
        });
        valid_plotter.plot_points(p, {
            stroke: "black",
            color: "darkslategray",
            size: 4,
            opacity: 0.75,
            transition: 25
        });
    }

    function plot_variational_distribution(train_plotter, valid_plotter) {
        tf.tidy(() => {
            var mean = [
                layer1WeightsMu.dataSync()[0],
                layer1WeightsMu.dataSync()[1],
            ];
            var std = [
                tf.exp(layer1WeightsLogSigma.add(eps)).dataSync()[0],
                tf.exp(layer1WeightsLogSigma.add(eps)).dataSync()[1],
            ];
            for (var i = 0; i < 5; i++) {
                for (var t = 0, n = 0; t <= Math.PI * 2 + param.step_size; t += param.step_size, n++) {
                    isocontours[i][n] = {
                        x: mean[0] + i * std[0] * Math.cos(t),
                        y: mean[1] + i * std[1] * Math.sin(t)
                    };
                }
            }
        });

        train_plotter.plot_path(isocontours, {
            color: "black",
            fill: "white",
            width: 1,
            opacity: 1 / 6,
            id: "#distribution"
        });
        valid_plotter.plot_path(isocontours, {
            color: "black",
            fill: "white",
            width: 1,
            opacity: 1 / 6,
            id: "#distribution"
        });
    }

    function plot_avg_curve(plotter, seeds) {
        var d = [];
        var avg_curve = tf.tidy(() => {
            const avg_pred = tf.stack(seeds.unstack().map(seed => {
                return predict(tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]), seed);
            })).mean(0);
            return avg_pred.dataSync();
        }).map((y, i) => {
            d.push({
                x: curve_x_extended[i],
                y: y
            });
        });

        plotter.plot_path([d], {
            color: "red",
            width: 5,
            opacity: 1,
            id: '#float'
        });
    }

    function plot_avg_loss(plotter, seeds) {
        var avg_test_loss = tf.tidy(() => {
            const avg_pred = tf.stack(seeds.unstack().map(seed => {
                return predict(tf.tensor2d(valid_xs), seed);
            })).mean(0);
            return tf.losses.meanSquaredError(avg_pred, tf.tensor2d(valid_ys)).dataSync();
        });
        avg_loss.push(avg_test_loss);
        var avg_loss_data = avg_loss.map((l, i) => {
            return {
                x: (i + 1) / (avg_loss.length + 1),
                y: l
            };
        });
        plotter.plot_path([avg_loss_data], {
            color: "black",
            width: 3,
            opacity: 1,
            id: "#float"
        });
    }

    function initial_plot() {
        plot_contours(train_loss_plotter, valid_loss_plotter);
        plot_MLE(progress_plotter);
        plot_train_and_valid_points(curve_plotter, training_points_data, validation_points_data);
        plot();
    }

    function plot_contours(train_plotter, valid_plotter) {
        var train_contour_data = new Array(param.n * param.m);
        var valid_contour_data = new Array(param.n * param.m);
        for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
            for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
                train_contour_data[k] = tf.tidy(() => {
                    const w1 = tf.tensor([
                        [inv_x_scale(w_1 * SCALING_FACTOR), inv_y_scale(w_2 * SCALING_FACTOR)]
                    ]);
                    const layer1 = tf.tensor2d(train_xs).matMul(w1).add(layer1Bias).tanh();
                    const layer2 = layer1.matMul(layer2Weights).add(layer2Bias).tanh();
                    const layer3 = layer2.matMul(layer3Weights).add(layer3Bias).tanh();
                    const output = layer3.matMul(layer4Weights).add(layer4Bias);
                    return tf.exp(tf.losses.meanSquaredError(output, tf.tensor2d(train_ys)).mul(tf.scalar(-1))).dataSync();
                });
                valid_contour_data[k] = tf.tidy(() => {
                    const w1 = tf.tensor([
                        [inv_x_scale(w_1 * SCALING_FACTOR), inv_y_scale(w_2 * SCALING_FACTOR)]
                    ]);
                    const layer1 = tf.tensor2d(valid_xs).matMul(w1).add(layer1Bias).tanh();
                    const layer2 = layer1.matMul(layer2Weights).add(layer2Bias).tanh();
                    const layer3 = layer2.matMul(layer3Weights).add(layer3Bias).tanh();
                    const output = layer3.matMul(layer4Weights).add(layer4Bias);
                    return tf.exp(tf.losses.meanSquaredError(output, tf.tensor2d(valid_ys)).mul(tf.scalar(-1))).dataSync();
                });
            }
        }
        plot_contour(train_plotter, train_contour_data, train_contour_color, train_contour_scale);
        plot_contour(valid_plotter, valid_contour_data, valid_contour_color, valid_contour_scale);
    }

    function plot_MLE(plotter) {
        MLE = [];
        for (var i = 0; i < 1; i += 0.99) {
            MLE.push({
                x: i,
                y: 0.09
            }); //MLE validation loss
        }
        plotter.plot_path([MLE], {
            color: "darkgreen",
            width: 2,
            opacity: 0.5,
            id: "#fixed"
        });
    }

    function plot_contour(plotter, data, color, contours) {
        plotter.plot_contour(data, {
            n: param.n,
            m: param.m,
            color_scale: color,
            contour_scale: contours,
            flip_color: true,
            id: "#contour"
        });
    }

    return {
        start: start,
        stop: stop,
        is_running: is_running,
    };
}
