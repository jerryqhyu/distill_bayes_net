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
    const optimizer = tf.train.adam(0.05);

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

    function reset() {

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
                    const loss1 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[0]), tf.tensor2d(experiment_ys));
                    const loss2 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[1]), tf.tensor2d(experiment_ys));
                    const loss3 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[2]), tf.tensor2d(experiment_ys));
                    const loss4 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[3]), tf.tensor2d(experiment_ys));
                    const loss5 = tf.losses.meanSquaredError(predict(tf.tensor2d(experiment_xs), s[4]), tf.tensor2d(experiment_ys));
                    const logLik = loss1.add(loss2).add(loss3).add(loss4).add(loss5).div(tf.scalar(5)).div(tf.scalar(1e-2));
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

    setup();

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
        // plot_avg();
        plot_path();
        plot_variational_distribution();
        plot_weight();
        // graph_plotter.plot_neural_net(net, "#float");
    }


    function reset() {

    }

    function plot_train_and_valid_points() {
        curve_plotter.plot_points(training_points_data, {
            stroke: "red",
            color: "red",
            size: 4,
            opacity: 1,
            id: "#training_point"
        });
        curve_plotter.plot_points(validation_points_data, {
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

    function plot_path() {
        var seed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var curves = seed.map(s => {
            var d = [];
            tf.tidy(() => {
                return predict(tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]), s).dataSync()
            }).forEach((y, i) => {
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
            opacity: 1,
        });
    }

    function plot_weight() {
        var p = [{
            x: layer1WeightsMu.dataSync()[0],
            y: layer1WeightsMu.dataSync()[1],
        }];

        train_loss_plotter.plot_points(p, {
            stroke: "black",
            color: "darkslategray",
            size: 7,
            opacity: 1,
            transition: 25,
            on_drag: on_drag,
            dragging: dragging,
            end_drag: end_drag
        });
        valid_loss_plotter.plot_points(p, {
            stroke: "black",
            color: "darkslategray",
            size: 7,
            opacity: 1,
            transition: 25,
            on_drag: on_drag,
            dragging: dragging,
            end_drag: end_drag
        });
    }

    function plot_variational_distribution() {
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

        train_loss_plotter.plot_path(isocontours, {
            color: "black",
            fill: "white",
            width: 1,
            opacity: 1 / 6,
            id: "#distribution"
        });
        valid_loss_plotter.plot_path(isocontours, {
            color: "black",
            fill: "white",
            width: 1,
            opacity: 1 / 6,
            id: "#distribution"
        });
    }

    function initial_plot() {
        plot_contours();
        plot_MLE();
        plot_train_and_valid_points();
        plot();
    }

    function plot_contours() {
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
        plot_contour(train_loss_plotter, train_contour_data, train_contour_color, train_contour_scale);
        plot_contour(valid_loss_plotter, valid_contour_data, valid_contour_color, valid_contour_scale);
    }

    function plot_MLE() {
        MLE = [];
        for (var i = 0; i < 1; i += param.step_size) {
            MLE.push({
                x: i,
                y: 2.7963
            }); //MLE validation loss
        }
        progress_plotter.plot_path([MLE], {
            color: "darkgreen",
            width: 2,
            opacity: 0.5,
            id: "#curve"
        });
    }

    // function plot_avg(curve, valid) {
    //     var avg_valid = compute_avg_prediction(valid);
    //     avg_loss.push(get_test_loss_from_prediction(avg_valid));

    //     var avg_loss_data = [];
    //     for (var i = 0; i < avg_loss.length; i++) {
    //         avg_loss_data.push({
    //             x: (i + 1) / (avg_loss.length + 1),
    //             y: avg_loss[i]
    //         });
    //     }
    //     progress_plotter.plot_path([avg_loss_data], {
    //         color: "black",
    //         width: 3,
    //         opacity: 1,
    //         id: "#float"
    //     });
    // }

    // function compute_avg_prediction(pred) {
    //     var avg_pred = [];
    //     for (var i = 0; i < pred[0].length; i++) {
    //         avg = 0;
    //         for (var j = 0; j < pred.length; j++) {
    //             avg += pred[j][i].y / pred.length;
    //         }
    //         avg_pred.push({x: pred[0][i].x,
    //             y: avg
    //         });
    //     }
    //     return avg_pred;
    // }

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

    // function get_test_loss_from_prediction(avg_prediction) {
    //     var total_loss = 0;
    //     var predicted;
    //     var true_label;
    //     for (var j = 0; j < param.validation_points.length; j++) {
    //         true_label = Math.sin(param.validation_points[j]) + param.validation_noise[j];
    //         total_loss += 0.5 * (true_label - avg_prediction[j].y) * (true_label - avg_prediction[j].y);
    //     }
    //     return total_loss;
    // }

    function on_drag(d) {
        d3.select(this).raise().classed("active", true);
    }

    function dragging(d) {
        var new_x = d3.mouse(this)[0];
        var new_y = d3.mouse(this)[1];

        // d3.select(this).attr("cx", new_x).attr("cy", new_y);
        // net.getLayer(1).setWeights([
        //     [inv_x_scale(new_x)],
        //     [inv_y_scale(new_y)]
        // ]);
        // plot();
    }

    function end_drag(d) {
        d3.select(this).raise().classed("active", false);
    }

    function mouseover() {
        d3.select(this).attr("r", 10);
    }

    function mouseout() {
        d3.select(this).attr("r", 5);
    }

    return {
        start: start,
        stop: stop,
        is_running: is_running,
        reset: reset
    };
}
