function mlptfjs(curve_div, train_loss_div, valid_loss_div) {
	this.div_id = curve_div.attr('id');

	// 4 layer deep net
	const layer1WeightsDeep = tf.variable(tf.tensor(param.layer1w));
	const layer1BiasDeep = tf.tensor(param.layer1b);
	const layer2WeightsDeep = tf.tensor(param.layer2w);
	const layer2BiasDeep = tf.tensor(param.layer2b);
	const layer3WeightsDeep = tf.tensor(param.layer3w);
	const layer3BiasDeep = tf.tensor(param.layer3b);
	const layer4WeightsDeep = tf.tensor(param.layer4w);
	const layer4BiasDeep = tf.tensor(param.layer4b);

	// 3 layer shallow net
	const layer1WeightsShallow = tf.variable(tf.randomNormal([1, 2], 0, 0.5, 'float32', 57545));
	const layer1BiasShallow = tf.zeros([2]);
	const layer2WeightsShallow = tf.randomNormal([2, 1], 0, 0.5, 'float32', 86351);
	const layer2BiasShallow = tf.zeros([1]);

	// linear regression
	const layer1WeightsLinear = tf.variable(tf.randomNormal([1, 1], 0, 0.5, 'float32', 1));
	const layer1BiasLinear = tf.variable(tf.zeros([1]));

	var curve_plotter = new Plotter(curve_div, param.curve_domain_x, param.curve_domain_y,
		false, false);
	var train_loss_plotter = new Plotter(train_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);
	var valid_loss_plotter = new Plotter(valid_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);

	var inv_x_scale = d3.scaleLinear().domain([0, train_loss_plotter.width]).range(param.loss_domain_x);
	inv_x_scale.clamp(true);
	var inv_y_scale = d3.scaleLinear().domain([train_loss_plotter.height, 0]).range(param.loss_domain_y);
	inv_y_scale.clamp(true);

	var deep_train_contour_data = new Array(param.n * param.m);
	var deep_valid_contour_data = new Array(param.n * param.m);
	var shallow_train_contour_data = new Array(param.n * param.m);
	var shallow_valid_contour_data = new Array(param.n * param.m);
	var linear_train_contour_data = new Array(param.n * param.m);
	var linear_valid_contour_data = new Array(param.n * param.m);
	var pred = new Array(curve_x.length);

	var SCALING_FACTOR = train_loss_plotter.height / param.n;

	var predict = predictDeep;
	setup();

	function predictDeep(x) {
		return tf.tidy(() => {
			const l1 = x.matMul(layer1WeightsDeep).add(layer1BiasDeep).tanh();
			const l2 = l1.matMul(layer2WeightsDeep).add(layer2BiasDeep).tanh();
			const l3 =  l2.matMul(layer3WeightsDeep).add(layer3BiasDeep).tanh();
			return l3.matMul(layer4WeightsDeep).add(layer4BiasDeep);
		});
	}

	function predictShallow(x) {
		return tf.tidy(() => {
			const l1 = x.matMul(layer1WeightsShallow).add(layer1BiasShallow).tanh();
			return l1.matMul(layer2WeightsShallow).add(layer2BiasShallow);
		});
	}

	function predictLinear(x) {
		return tf.tidy(() => {
			return x.matMul(layer1WeightsLinear).add(layer1BiasLinear);
		});
	}

	function plot() {
		plot_path();
		plot_weight();
	}

	function radio_button_state() {
		var radios = document.getElementsByName('net_type');
		for (var i = 0, length = radios.length; i < length; i++) {
			if (radios[i].checked) {
				return radios[i].value;
			}
		}
	}

	function setup() {
		curve_x.forEach((x, i) => {
			pred[i] = {
				x: x,
				y: 0
			};
		});

		curve_plotter.add_group("training_point");
		curve_plotter.add_group("validation_point");
		train_loss_plotter.add_group("contour");
		valid_loss_plotter.add_group("contour");
		train_loss_plotter.add_x_axis_label("w1");
		train_loss_plotter.add_y_axis_label("w2");
		valid_loss_plotter.add_x_axis_label("w1");
		valid_loss_plotter.add_y_axis_label("w2");
		initial_plot();
	}

	function update() {
		if (radio_button_state() === 'Linear') {
			predict = predictLinear;
			plot_contour(train_loss_plotter, linear_train_contour_data,
				train_contour_color, train_contour_scale);
			plot_contour(valid_loss_plotter, linear_valid_contour_data,
				valid_contour_color, valid_contour_scale);
		} else if (radio_button_state() === 'Deep') {
			predict = predictDeep;
			plot_contour(train_loss_plotter, deep_train_contour_data,
				train_contour_color, train_contour_scale);
			plot_contour(valid_loss_plotter, deep_valid_contour_data,
				valid_contour_color, valid_contour_scale);
		} else {
			predict = predictShallow;
			plot_contour(train_loss_plotter, shallow_train_contour_data,
				train_contour_color, train_contour_scale);
			plot_contour(valid_loss_plotter, shallow_valid_contour_data,
				valid_contour_color, valid_contour_scale);
		}
		
		plot();
	}

	function initial_plot() {
		for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
			for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
				const w1 = tf.tensor([
					[inv_x_scale(w_1 * SCALING_FACTOR), inv_y_scale(w_2 * SCALING_FACTOR)]
				]);
				const lw1 = tf.tensor([
					[inv_x_scale(w_1 * SCALING_FACTOR)]
				]);
				const lb1 = tf.tensor([inv_y_scale(w_2 * SCALING_FACTOR)]);
				deep_train_contour_data[k] = tf.tidy(() => {
					const layer1 = tf.tensor2d(train_xs).matMul(w1).add(layer1BiasDeep).tanh();
					const layer2 = layer1.matMul(layer2WeightsDeep).add(layer2BiasDeep).tanh();
					const layer3 = layer2.matMul(layer3WeightsDeep).add(layer3BiasDeep).tanh();
					const output = layer3.matMul(layer4WeightsDeep).add(layer4BiasDeep);
					return tf.losses.meanSquaredError(output, tf.tensor2d(train_ys)).dataSync();
				});
				deep_valid_contour_data[k] = tf.tidy(() => {
					const layer1 = tf.tensor2d(valid_xs).matMul(w1).add(layer1BiasDeep).tanh();
					const layer2 = layer1.matMul(layer2WeightsDeep).add(layer2BiasDeep).tanh();
					const layer3 = layer2.matMul(layer3WeightsDeep).add(layer3BiasDeep).tanh();
					const output = layer3.matMul(layer4WeightsDeep).add(layer4BiasDeep);
					return tf.losses.meanSquaredError(output, tf.tensor2d(valid_ys)).dataSync();
				});
				shallow_train_contour_data[k] = tf.tidy(() => {
					const layer1 = tf.tensor2d(train_xs).matMul(w1).add(layer1BiasShallow).tanh();
					const output = layer1.matMul(layer2WeightsShallow).add(layer2BiasShallow);
					return tf.losses.meanSquaredError(output, tf.tensor2d(train_ys)).dataSync();
				});
				shallow_valid_contour_data[k] = tf.tidy(() => {
					const layer1 = tf.tensor2d(valid_xs).matMul(w1).add(layer1BiasShallow).tanh();
					const output = layer1.matMul(layer2WeightsShallow).add(layer2BiasShallow);
					return tf.losses.meanSquaredError(output, tf.tensor2d(valid_ys)).dataSync();
				});
				linear_train_contour_data[k] = tf.tidy(() => {
					const output = tf.tensor2d(train_xs).matMul(lw1).add(lb1);
					return tf.losses.meanSquaredError(output, tf.tensor2d(train_ys)).dataSync();
				});
				linear_valid_contour_data[k] = tf.tidy(() => {
					const output = tf.tensor2d(valid_xs).matMul(lw1).add(lb1);
					return tf.losses.meanSquaredError(output, tf.tensor2d(valid_ys)).dataSync();
				});
			}
		}
		plot_contour(train_loss_plotter, deep_train_contour_data, train_contour_color,
			train_contour_scale);
		plot_contour(valid_loss_plotter, deep_valid_contour_data, valid_contour_color,
			valid_contour_scale);
		plot_train_and_valid_points();
		plot();
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
		var pred = [];
		tf.tidy(() => { return predict(tf.tensor2d(curve_x, [curve_x.length, 1])).dataSync() }).forEach((y, i) => {
			pred.push({
				x: curve_x[i],
				y: y
			});
		})
		curve_plotter.plot_path([pred], {
			color: "darkorange",
			width: 3,
			opacity: 1,
			transition: 50
		});
	}

	function plot_weight() {
		var p;
		if (radio_button_state() === 'Linear') {
			p = [{
				x: layer1WeightsLinear.dataSync()[0],
				y: layer1BiasLinear.dataSync()[0],
			}];
		} else if (radio_button_state() === 'Deep') {
			p = [{
				x: layer1WeightsDeep.dataSync()[0],
				y: layer1WeightsDeep.dataSync()[1],
			}];
		} else {
			p = [{
				x: layer1WeightsShallow.dataSync()[0],
				y: layer1WeightsShallow.dataSync()[1],
			}];
		}
		train_loss_plotter.plot_points(p, {
			stroke: "black",
			color: "darkslategray",
			size: 7,
			opacity: 1,
			transition: 25,
			on_drag: on_drag,
			dragging: dragging,
			end_drag: end_drag,
			mouseover: mouseover,
			mouseout: mouseout
		});
		valid_loss_plotter.plot_points(p, {
			stroke: "black",
			color: "darkslategray",
			size: 7,
			opacity: 1,
			transition: 25,
			on_drag: on_drag,
			dragging: dragging,
			end_drag: end_drag,
			mouseover: mouseover,
			mouseout: mouseout
		});
	}

	function on_drag(d) {
		d3.select(this).raise().classed("active", true);
	}

	function dragging(d) {
		var new_x = d3.mouse(this)[0];
		var new_y = d3.mouse(this)[1];
		d3.select(this).attr("cx", new_x).attr("cy", new_y);
		if (radio_button_state() === 'Linear') {
			layer1WeightsLinear.assign(tf.tensor2d([[inv_x_scale(new_x)]]));
			layer1BiasLinear.assign(tf.tensor1d([inv_y_scale(new_y)]));
		} else if (radio_button_state() === 'Deep') {
			layer1WeightsDeep.assign(tf.tensor2d([[inv_x_scale(new_x), inv_y_scale(new_y)]]));
		} else {
			layer1WeightsShallow.assign(tf.tensor2d([[inv_x_scale(new_x), inv_y_scale(new_y)]]));			
		}
		plot();
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
		update: update,
	};
}