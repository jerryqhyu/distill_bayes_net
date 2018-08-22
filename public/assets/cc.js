function changingContour(train_loss_div, valid_loss_div) {
    this.div_id = train_loss_div.attr('id');
    var training = false;
	const optimizer = tf.train.momentum(param.learning_rate, param.momentum);

	// 4 layer deep net
	const layer1WeightsDeep = tf.variable(tf.tensor(param.layer1w));
	const layer1BiasDeep = tf.variable(tf.tensor(param.layer1b));
	const layer2WeightsDeep = tf.variable(tf.tensor(param.layer2w));
	const layer2BiasDeep = tf.variable(tf.tensor(param.layer2b));
	const layer3WeightsDeep = tf.variable(tf.tensor(param.layer3w));
	const layer3BiasDeep = tf.variable(tf.tensor(param.layer3b));
	const layer4WeightsDeep = tf.variable(tf.tensor(param.layer4w));
	const layer4BiasDeep = tf.variable(tf.tensor(param.layer4b));

	var train_loss_plotter = new Plotter(train_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);
	var valid_loss_plotter = new Plotter(valid_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);

	var train_contour = new Array(param.n_cc * param.m_cc);
    var valid_contour = new Array(param.n_cc * param.m_cc);
    
	const contourY = tf.range(0, param.m_cc)
				.expandDims(1)
				.tile([1, param.n_cc])
				.reshape([param.n_cc * param.m_cc, 1])
				.squeeze()
				.mul(tf.scalar((param.loss_domain_y[0] - param.loss_domain_y[1]) / param.m_cc))
				.add(tf.scalar(param.loss_domain_y[1]));
				
	const contourX = tf.range(0, param.n_cc)
				.tile([param.m_cc])
				.mul(tf.scalar((param.loss_domain_x[1] - param.loss_domain_x[0]) / param.n_cc))
				.add(tf.scalar(param.loss_domain_x[0]));

    const contourWeights = tf.stack([contourX, contourY]).transpose().reshape([param.n_cc * param.m_cc, 1, 2]);
    setup();
	
	async function start() {
        training = true;
		while (training) {
            update_contour();
			plot();
			await trainStep();
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

	function reset() {

	}

	function update_contour() {
		train_contour = tf.tidy(() => {
            return tf.stack(contourWeights.unstack().map(w => {
				return predict(tf.tensor2d(train_xs), w).squaredDifference(tf.tensor2d(train_ys)).mean();
            })).dataSync();
        });
        valid_contour = tf.tidy(() => {
            return tf.stack(contourWeights.unstack().map(w => {
				return predict(tf.tensor2d(valid_xs), w).squaredDifference(tf.tensor2d(valid_ys)).mean();
            })).dataSync();
        });
	}

	function predict(x, layer1Weight) {
		return tf.tidy(() => {
			const l1 = x.matMul(layer1Weight).add(layer1BiasDeep).tanh();
			const l2 = l1.matMul(layer2WeightsDeep).add(layer2BiasDeep).tanh();
			const l3 =  l2.matMul(layer3WeightsDeep).add(layer3BiasDeep).tanh();
			return l3.matMul(layer4WeightsDeep).add(layer4BiasDeep);
		});
	}

	async function trainStep() {
		optimizer.minimize(() => {
            return tf.tidy(() => {
                const predsYs = predict(tf.tensor2d(train_xs), layer1WeightsDeep); // input N*D
                return tf.losses.meanSquaredError(predsYs, tf.tensor2d(train_ys))
            });
		});
		await tf.nextFrame();
	}

	function plot() {
		plot_contour(train_loss_plotter, train_contour,
			train_contour_color, train_contour_scale_cc);
		plot_contour(valid_loss_plotter, valid_contour,
			valid_contour_color, valid_contour_scale_cc);
		plot_weight();
	}

	function setup() {
		update_contour();
		train_loss_plotter.add_group("contour");
		valid_loss_plotter.add_group("contour");
		train_loss_plotter.add_x_axis_label("w1");
		train_loss_plotter.add_y_axis_label("w2");
		valid_loss_plotter.add_x_axis_label("w1");
		valid_loss_plotter.add_y_axis_label("w2");
		plot();
	}

	function plot_contour(plotter, data, color, contours) {
		plotter.plot_contour(data, {
			n: param.n_cc,
			m: param.m_cc,
			color_scale: color,
			contour_scale: contours,
			id: "#contour"
		});
	}

	function plot_weight() {
		var p = [{
				x: layer1WeightsDeep.dataSync()[0],
				y: layer1WeightsDeep.dataSync()[1],
			}];
		train_loss_plotter.plot_points(p, {
			stroke: "black",
			color: "darkslategray",
			size: 7,
			opacity: 1,
			transition: 25
		});
		valid_loss_plotter.plot_points(p, {
			stroke: "black",
			color: "darkslategray",
			size: 7,
			opacity: 1,
			transition: 25
		});
	}

	return {
		start: start,
		stop: stop,
		is_running: is_running,
		reset: reset
	};
}