function classification(curve_div, train_loss_div, valid_loss_div) {
    this.div_id = train_loss_div.attr('id');
    var training = false;

    const optimizer = tf.train.adam(0.5);

	// 4 layer net
	const layer1Weights = tf.variable(tf.randomNormal([1, 2], 0, 0.5, 'float32', 2));
	const layer1Bias = tf.randomNormal([2], 0, 0.5, 'float32', 2);
	const layer2Weights = tf.randomNormal([2, 4], 0, 0.5, 'float32', 2);
	const layer2Bias = tf.randomNormal([4], 0, 0.5, 'float32', 2);
	const layer3Weights = tf.randomNormal([4, 4], 0, 0.5, 'float32', 2);
	const layer3Bias = tf.randomNormal([4], 0, 0.5, 'float32', 2);
	const layer4Weights = tf.randomNormal([4, 2], 0, 0.5, 'float32', 2);
    const layer4Bias = tf.randomNormal([2], 0, 0.5, 'float32', 2);

    var classification_train_points = tf.randomNormal([10, 1], 0, 0.2, 'float32', 912).add(tf.tensor1d([-1])).concat(tf.randomNormal([10, 1], 0, 0.55, 'float32', 912).add(tf.tensor1d([1])));
    var classification_train_labels = tf.oneHot(tf.tile(tf.tensor2d([[0,1]], [1,2], 'int32'), [10,1]).transpose().reshape([1,20]).squeeze(), 2).cast('float32');

    var classification_valid_points = tf.randomNormal([25, 1], 0, 0.55, 'float32', 687).add(tf.tensor1d([-1])).concat(tf.randomNormal([25, 1], 0, 0.55, 'float32', 687).add(tf.tensor1d([1])));
    var classification_valid_labels = tf.oneHot(tf.tile(tf.tensor2d([[0,1]], [1,2], 'int32'), [25,1]).transpose().reshape([1,50]).squeeze(), 2).cast('float32');

    var curve_plotter = new Plotter(curve_div, param.classification_domain_x, param.classification_domain_y, false, false);
    var train_loss_plotter = new Plotter(train_loss_div, param.classification_loss_domain_x, param.classification_loss_domain_y, true, true);
    var valid_loss_plotter = new Plotter(valid_loss_div, param.classification_loss_domain_x, param.classification_loss_domain_y, true, true);

	const allX = tf.range(0, 100)
				.tile([100])
				.mul(tf.scalar((param.classification_domain_x[1] - param.classification_domain_x[0]) / 100))
				.add(tf.scalar(param.classification_domain_x[0]));
    const allInput = allX.transpose().reshape([100 * 100, 1]);

    let SCALING_FACTOR = train_loss_plotter.height / param.n;
    var inv_x_scale = d3.scaleLinear().domain([0, train_loss_plotter.width]).range(param.classification_loss_domain_x);
    inv_x_scale.clamp(true);
    var inv_y_scale = d3.scaleLinear().domain([train_loss_plotter.height, 0]).range(param.classification_loss_domain_y);
    inv_y_scale.clamp(true);

    async function start() {
        training = true;
        while(training) {
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
        return tf.tidy(() => {
            const l1 = x.matMul(layer1Weights).add(layer1Bias).relu();
            const l2 = l1.matMul(layer2Weights).add(layer2Bias).relu();
            const l3 = l2.matMul(layer3Weights).add(layer3Bias).relu();
            return l3.matMul(layer4Weights).add(layer4Bias).softmax();
        });
    }

    async function train() {
        optimizer.minimize(() => {
            return tf.tidy(() => {
                const loss = tf.losses.softmaxCrossEntropy(classification_train_labels, predict(classification_train_points)).mean();
                loss.print();
                return loss;
            });
        });
        await tf.nextFrame();
    }

    setup();

    function setup() {
        curve_plotter.add_group("prediction");
        curve_plotter.add_group("class1");
        curve_plotter.add_group("class2");
        curve_plotter.add_group("validation_point");

        train_loss_plotter.add_group("contour");
        valid_loss_plotter.add_group("contour");

        train_loss_plotter.add_group("pts");
        valid_loss_plotter.add_group("pts");

        train_loss_plotter.add_x_axis_label("w1");
        train_loss_plotter.add_y_axis_label("w2");
        valid_loss_plotter.add_x_axis_label("w1");
        valid_loss_plotter.add_y_axis_label("w2");
        initial_plot();
    }


    function plot() {
        plot_pred(curve_plotter);
        // plot_variational_distribution();
        plot_weight();
    }

    function plot_train_and_valid_points() {
        var train_class1 = tf.tidy(() => {return classification_train_points.slice([0, 0], [10, 1]).unstack().map(x => {
            return {x: x.dataSync()[0], y: -0.5}
        })});
        var train_class2 = tf.tidy(() => {return classification_train_points.slice([10, 0], [10, 1]).unstack().map(x => {
            return {x: x.dataSync()[0], y: -0.5}
        })});
        var valid_class1 = tf.tidy(() => {return classification_valid_points.slice([0, 0], [25, 1]).unstack().map(x => {
            return {x: x.dataSync()[0], y: 0.5}
        })});
        var valid_class2 = tf.tidy(() => {return classification_valid_points.slice([25, 0], [25, 1]).unstack().map(x => {
            return {x: x.dataSync()[0], y: 0.5}
        })});
        curve_plotter.plot_points(train_class1.concat(valid_class1), {
            stroke: "red",
            color: "red",
            size: 4,
            opacity: 1,
            id: "#class1"
        });
        curve_plotter.plot_points(train_class2.concat(valid_class2), {
            stroke: "green",
            color: "green",
            size: 4,
            opacity: 0.5,
            id: "#class2"
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

    function plot_pred() {
        var output = tf.tidy(() => {return predict(allInput).round().mul(tf.range(1, 3, 1, 'float32')).sum(1).dataSync()});
        curve_plotter.plot_contour(output, {
            n: 100,
            m: 100,
            color_scale: classification_contour_color,
            contour_scale: classification_contour_scale_cc,
            id: "#prediction"
        });
    }

    function plot_weight() {
        var p = [{
            x: layer1Weights.dataSync()[0],
            y: layer1Weights.dataSync()[1],
        }];

        train_loss_plotter.plot_points(p, {
            stroke: "black",
            color: "darkslategray",
            size: 7,
            opacity: 1,
            transition: 25,
        });
        valid_loss_plotter.plot_points(p, {
            stroke: "black",
            color: "darkslategray",
            size: 7,
            opacity: 1,
            transition: 25,
        });
    }

    function initial_plot() {
        plot_contours();
        plot_train_and_valid_points();
        plot();
    }

    function plot_contours() {
        var train_contour_data = new Array(param.n * param.m);
        var valid_contour_data = new Array(param.n * param.m);
        for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
            for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
                train_contour_data[k] = tf.tidy(() => {
                    const w1 = tf.tensor([[inv_x_scale(w_1 * SCALING_FACTOR), inv_y_scale(w_2 * SCALING_FACTOR)]]);
                    const layer1 = classification_train_points.matMul(w1).add(layer1Bias).relu();
                    const layer2 = layer1.matMul(layer2Weights).add(layer2Bias).relu();
                    const layer3 = layer2.matMul(layer3Weights).add(layer3Bias).relu();
                    const output = layer3.matMul(layer4Weights).add(layer4Bias).softmax();
                    return tf.losses.meanSquaredError(output, classification_train_labels).mean().dataSync();
                });
                valid_contour_data[k] = tf.tidy(() => {
                    const w1 = tf.tensor([[inv_x_scale(w_1 * SCALING_FACTOR), inv_y_scale(w_2 * SCALING_FACTOR)]]);
                    const layer1 = classification_valid_points.matMul(w1).add(layer1Bias).relu();
                    const layer2 = layer1.matMul(layer2Weights).add(layer2Bias).relu();
                    const layer3 = layer2.matMul(layer3Weights).add(layer3Bias).relu();
                    const output = layer3.matMul(layer4Weights).add(layer4Bias).softmax();
                    return tf.losses.meanSquaredError(output, classification_valid_labels).mean().dataSync();
                });
            }
        }
        plot_contour(train_loss_plotter, train_contour_data, classification_contour_loss_color, classification_contour_loss_scale);
        plot_contour(valid_loss_plotter, valid_contour_data, classification_contour_loss_color, classification_contour_loss_scale);
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

    function on_drag(d) {
        d3.select(this).raise().classed("active", true);
    }

    function dragging(d) {
        var new_x = d3.mouse(this)[0];
        var new_y = d3.mouse(this)[1];
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
    };
}