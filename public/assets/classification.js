function classification(curve_div) {
    this.div_id = curve_div.attr('id');
    var training = false;

    const optimizer = tf.train.adam(param.learning_rate);

	// 4 layer net
	const layer1Weights = tf.variable(tf.tensor2d([[0, 0]]));
	const layer1Bias = tf.variable(tf.randomNormal([2], 0, 0.5, 'float32', 2));
	const layer2Weights = tf.variable(tf.randomNormal([2, 16], 0, 0.5, 'float32', 2));
	const layer2Bias = tf.variable(tf.randomNormal([16], 0, 0.5, 'float32', 2));
	const layer3Weights = tf.variable(tf.randomNormal([16, 16], 0, 0.5, 'float32', 2));
	const layer3Bias = tf.variable(tf.randomNormal([16], 0, 0.5, 'float32', 2));
	const layer4Weights = tf.variable(tf.randomNormal([16, 2], 0, 0.5, 'float32', 2));
    const layer4Bias = tf.variable(tf.randomNormal([2], 0, 0.5, 'float32', 2));

    var classification_train_points = tf.randomNormal([param.classification_num_train_samples, 1], 0, 0.1, 'float32', 9).add(tf.tensor1d([-0.5]))
                                    .concat(tf.randomNormal([param.classification_num_train_samples, 1], 0, 0.1, 'float32', 9).add(tf.tensor1d([1.5])))
                                    .concat(tf.randomNormal([param.classification_num_train_samples, 1], 0, 0.1, 'float32', 9).add(tf.tensor1d([2])));
    var classification_train_labels = tf.oneHot(tf.tile(tf.tensor2d([[0,1]], [1,2], 'int32'), [param.classification_num_train_samples,1])
                            .transpose().reshape([1, param.classification_num_train_samples*2]).squeeze(), 2).concat(tf.tensor2d([[1,0],[1,0],[1,0],[1,0],[1,0]])).cast('float32');
                            classification_train_labels.print();
    var curve_plotter = new Plotter(curve_div, param.classification_domain_x, param.classification_domain_y, false, false);

	const allX = tf.range(0, 100)
				.mul(tf.scalar((param.classification_domain_x[1] - param.classification_domain_x[0]) / 100))
				.add(tf.scalar(param.classification_domain_x[0]));
    const allInput = allX.transpose().reshape([100, 1]);

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

    function l2_loss() {
        return tf.tidy(() => {
            const l1 = layer1Weights.pow(2).sum().add(layer1Bias.pow(2).sum());
            const l2 = layer2Weights.pow(2).sum().add(layer2Bias.pow(2).sum());
            const l3 = layer3Weights.pow(2).sum().add(layer3Bias.pow(2).sum());
            const l4 = layer4Weights.pow(2).sum().add(layer4Bias.pow(2).sum());
            const total = l1.add(l2).add(l3).add(l4).mul(0.01);
            total.print();
            return total;
        });
    }

    async function train() {
        optimizer.minimize(() => {
            return tf.tidy(() => {
                const loss = tf.losses.softmaxCrossEntropy(classification_train_labels, predict(classification_train_points)).mean();
                return loss;
            });
        });
        await tf.nextFrame();
    }

    setup();

    function setup() {
        curve_plotter.add_group("prediction");
        curve_plotter.add_group("prob");
        curve_plotter.add_group("train_class1");
        curve_plotter.add_group("train_class2");
        curve_plotter.add_group("valid_class1");
        curve_plotter.add_group("valid_class2");
        initial_plot();
    }


    function plot() {
        plot_prob();
        plot_pred();
    }

    function plot_train_and_valid_points() {
        var train_class1 = tf.tidy(() => {return classification_train_points.slice([0, 0], [param.classification_num_train_samples, 1]).concat(classification_train_points.slice([param.classification_num_train_samples*2, 0], [param.classification_num_train_samples, 1])).unstack().map(x => {
            return {x: x.dataSync()[0], y: 0};
        })});
        var train_class2 = tf.tidy(() => {return classification_train_points.slice([param.classification_num_train_samples, 0], [param.classification_num_train_samples, 1]).unstack().map(x => {
            return {x: x.dataSync()[0], y: 1};
        })});
        curve_plotter.plot_points(train_class1, {
            stroke: "white",
            color: "red",
            size: 4,
            opacity: 1,
            id: "#train_class1"
        });
        curve_plotter.plot_points(train_class2, {
            stroke: "white",
            color: "blue",
            size: 4,
            opacity: 1,
            id: "#train_class2"
        });
    }

    function plot_prob() {
        var output = tf.tidy(() => {
            const inp = tf.range(param.classification_domain_x[0], param.classification_domain_x[1] + 0.1, 0.1).expandDims().reshape([(param.classification_domain_x[1] - param.classification_domain_x[0]) / 0.1 + 1, 1]);
            var input = inp.dataSync();
            return predict(inp).unstack().map((x, i) => {
                return {x: input[i], y: x.dataSync()[1]} ;
            });
        });
        curve_plotter.plot_path([output], {
			color: "darkorange",
			width: 3,
			opacity: 1,
            transition: 50,
            id: "#prob"
		});
    }

    function plot_pred() {
        var output = tf.tidy(() => {return predict(allInput).round().mul(tf.range(1, 3, 1, 'float32')).sum(1).tile([100]).dataSync()});
        curve_plotter.plot_contour(output, {
            n: 100,
            m: 100,
            color_scale: classification_contour_color,
            contour_scale: classification_contour_scale_cc,
            id: "#prediction"
        });
    }

    function initial_plot() {
        plot_train_and_valid_points();
        plot();
    }

    return {
        start: start,
        stop: stop,
        is_running: is_running,
    };
}
