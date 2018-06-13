function mlptfjs(curve_div, train_loss_div, valid_loss_div) {

    this.div_id = curve_div.attr('id');

    this.start = function() {
		if (!training_interval) {
			training_interval = d3.timer(train_epoch, 50);
			plot_interval = d3.timer(plot);
		}
	}

	this.stop = function() {
		if (this.is_running()) {
			training_interval.stop();
			plot_interval.stop();
			training_interval = undefined;
			plot_interval = undefined;
		}
	}

	this.is_running = function () {
		return training_interval != null;
	}

	this.reset = function() {
		this.stop();
		deep_net = make_deep_net();
		deep_trainer = new net_lib.Trainer(deep_net, {
			batch_size: param.batch_size
		});
		linear_net = make_linear_net();
		linear_trainer = new net_lib.Trainer(linear_net, {
			batch_size: param.batch_size
		});
		shallow_net = make_shallow_net();
		shallow_trainer = new net_lib.Trainer(shallow_net, {
			batch_size: param.batch_size
		});
		if (radio_button_state() === 'Linear') {
			net = linear_net;
			trainer = linear_trainer;
		} else if (radio_button_state() === 'Deep') {
			net = deep_net;
			trainer = deep_trainer;
		} else {
			net = shallow_net;
			trainer = shallow_trainer;
		}
		plot();
		epoch_count = 0;
	}

	var curve_plotter = new Plotter(curve_div, param.curve_domain_x, param.curve_domain_y,
		false, false);
	var train_loss_plotter = new Plotter(train_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);
	var valid_loss_plotter = new Plotter(valid_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);
	var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, true);

	var inv_x_scale = d3.scaleLinear().domain([0, train_loss_plotter.width]).range(param.loss_domain_x);
	inv_x_scale.clamp(true);

	var inv_y_scale = d3.scaleLinear().domain([train_loss_plotter.height, 0]).range(param.loss_domain_y);
	inv_y_scale.clamp(true);

	var deep_train_contour_data = new Array(param.n * param.m);
	var deep_valid_contour_data = new Array(param.n * param.m);
	var pred = new Array(curve_x.length);

	//define a neural network
	var deep_net = make_deep_net();
	var deep_trainer = new net_lib.Trainer(deep_net, {
		batch_size: param.batch_size
	});
	var shallow_net = make_shallow_net();
	var shallow_trainer = new net_lib.Trainer(shallow_net, {
		batch_size: param.batch_size
	});
	var linear_net = make_linear_net();
	var linear_trainer = new net_lib.Trainer(linear_net, {
		batch_size: param.batch_size
	});
	var net = deep_net;
	var trainer = deep_trainer;

	//interval controller
	var training_interval;
	var plot_interval;
	var epoch_count = 0;
	var obtaining_param = 0;

	setup();

	function plot() {
		plot_path();
		plot_weight();
		graph_plotter.plot_neural_net(net);
	}

	function train_epoch() {
		var x;
		for (var j = 0; j < param.train_points.length; j++) {
			x = new net_lib.Vol([param.train_points[j]]);
			trainer.train(x, [Math.sin(param.train_points[j]) + param.train_noise[j]]);
		}
		if (obtaining_param) {
			for (var j = 0; j < param.validation_points.length; j++) {
				x = new net_lib.Vol([param.validation_points[j]]);
				trainer.train(x, [Math.sin(param.validation_points[j]) + param.validation_noise[
					j]]);
			}
		}
		epoch_count++;
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
		var predicted_value;
		var x_vol;
		curve_x.forEach((x, i) => {
			pred[i] = {
				x: x,
				y: 0
			};
		});

		curve_plotter.add_group("training_points");
		curve_plotter.add_group("validation_points");
		train_loss_plotter.add_group("contour");
		valid_loss_plotter.add_group("contour");
		train_loss_plotter.add_x_axis_label("w1");
		train_loss_plotter.add_y_axis_label("w2");
		valid_loss_plotter.add_x_axis_label("w1");
		valid_loss_plotter.add_y_axis_label("w2");
		initial_plot();
	}

	function make_deep_net() {
        const input = tf.input({shape: [1]});
        const denseLayer1 = tf.layers.dense({units: 2, activation: 'softmax'});
        const denseLayer2 = tf.layers.dense({units: 4, activation: 'softmax'});
        const denseLayer3 = tf.layers.dense({units: 4, activation: 'softmax'});
        const output = denseLayer3.apply(denseLayer2.apply(denseLayer1.apply(input)));
		var layer_defs = [];
        return tf.model({inputs: input, outputs: output});
	}

	function initial_plot() {
		var deep_dummy_net = make_deep_net();
		for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
			for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
				deep_train_contour_data[k] = compute_training_loss(deep_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
				deep_valid_contour_data[k] = compute_validation_loss(deep_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
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
			id: "#training_points"
		});
		curve_plotter.plot_points(validation_points_data, {
			stroke: "green",
			color: "green",
			size: 4,
			opacity: 0.5,
			id: "#validation_points"
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

	function compute_validation_loss(dummy_net, w_1, w_2) {
		var total_loss = 0;
		var predicted;
		var true_label;
		var x_val;
		dummy_net.getLayer(1).setWeights([[w_1], [w_2]]);
		for (var j = 0; j < param.validation_points.length; j++) {
			x_val = new net_lib.Vol([param.validation_points[j]]);
			true_label = Math.sin(param.validation_points[j]) + param.validation_noise[j];
			total_loss += dummy_net.getCostLoss(x_val, true_label);
		}
		return total_loss;
	}

	function compute_training_loss(dummy_net, w_1, w_2) {
		var total_loss = 0;
		var predicted;
		var true_label;
		var x_val;
		dummy_net.getLayer(1).setWeights([[w_1], [w_2]]);
		for (var i = 0; i < param.train_points.length; i++) {
			x_val = new net_lib.Vol([param.train_points[i]]);
			true_label = Math.sin(param.train_points[i]) + param.train_noise[i];
			total_loss += dummy_net.getCostLoss(x_val, true_label);
		}
		return total_loss;
	}

	function plot_path() {
		var predicted_value;
		var x_val;
		curve_x.forEach((x, i) => {
			x_val = new net_lib.Vol([x]);
			predicted_value = net.forward(x_val);
			pred[i].y = predicted_value.w[0];
		});

		curve_plotter.plot_path([pred], {
			color: "darkorange",
			width: 3,
			opacity: 1,
		});
	}

	function plot_weight() {
		data = [
			{
				x: net.getLayer(1).filters[0].w,
				y: net.getLayer(1).filters[1].w
            }
        ];
		train_loss_plotter.plot_points(data, {
			stroke: "black",
			color: "darkslategray",
			size: 7,
			opacity: 1,
			transition: 25,
			on_drag: on_drag,
			dragging: dragging,
			end_drag: end_drag
		});
		valid_loss_plotter.plot_points(data, {
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

	function on_drag(d) {
		d3.select(this).raise().classed("active", true);
	}

	function dragging(d) {
		var new_x = d3.mouse(this)[0];
		var new_y = d3.mouse(this)[1];

		d3.select(this).attr("cx", new_x).attr("cy", new_y);
		net.getLayer(1).setWeights([
            [inv_x_scale(new_x)],
            [inv_y_scale(new_y)]
        ]);
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
}
