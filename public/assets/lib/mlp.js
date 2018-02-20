function mlp(curve_div, train_loss_div, valid_loss_div, graph_div) {

	var curve_plotter = Plotter(curve_div, param.curve_domain_x, param.curve_domain_y,
		false, false);
	var train_loss_plotter = Plotter(train_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);
	var valid_loss_plotter = Plotter(valid_loss_div, param.loss_domain_x,
		param.loss_domain_y, true, true);
	var graph_plotter = Plotter(graph_div, [0, 1], [0, 1], false, true);

	var linear_train_contour_data = new Array(param.n * param.m);
	var linear_valid_contour_data = new Array(param.n * param.m);
	var shallow_train_contour_data = new Array(param.n * param.m);
	var shallow_valid_contour_data = new Array(param.n * param.m);
	var deep_train_contour_data = new Array(param.n * param.m);
	var deep_valid_contour_data = new Array(param.n * param.m);

	//define a neural network
	var deep_net = make_deep_net();
	var deep_trainer = new net_lib.Trainer(deep_net, {
		method: 'sgd',
		learning_rate: param.learning_rate,
		momentum: param.momentum,
		batch_size: param.batch_size
	});
	var shallow_net = make_shallow_net();
	var shallow_trainer = new net_lib.Trainer(shallow_net, {
		method: 'sgd',
		learning_rate: param.learning_rate,
		momentum: param.momentum,
		batch_size: param.batch_size
	});
	var linear_net = make_linear_net();
	var linear_trainer = new net_lib.Trainer(linear_net, {
		method: 'sgd',
		learning_rate: param.learning_rate,
		momentum: param.momentum,
		batch_size: param.batch_size
	});
	var net = deep_net;
	var trainer = deep_trainer;

	//interval controller
	var timer;
	var epoch_count = 0;
	var obtaining_param = 0;

	setup();

	function plot() {
		plot_line();
		plot_weight();
		graph_plotter.plot_neural_net(net, "#float");
	}

	function train() {
		if (!timer) {
			timer = d3.timer(train_epoch, 50);
			if (obtaining_param) {
				net.getLayer(1).freeze_weights();
			} else {
				net.freezeAllButLayer(1);
			}
		}
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
		clear();
		plot();
		epoch_count++;
	}

	function reset() {
		deep_net = make_deep_net();
		deep_trainer = new net_lib.Trainer(deep_net, {
			method: 'sgd',
			learning_rate: param.learning_rate,
			momentum: param.momentum,
			batch_size: param.batch_size
		});
		linear_net = make_linear_net();
		linear_trainer = new net_lib.Trainer(linear_net, {
			method: 'sgd',
			learning_rate: param.learning_rate,
			momentum: param.momentum,
			batch_size: param.batch_size
		});
		shallow_net = make_shallow_net();
		shallow_trainer = new net_lib.Trainer(shallow_net, {
			method: 'sgd',
			learning_rate: param.learning_rate,
			momentum: param.momentum,
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
		clear();
		plot();
		pause_training();
		epoch_count = 0;
	}

	function update() {
		pause_training();
		svg2.select("#contour").selectAll("*").remove();
		svg3.select("#contour").selectAll("*").remove();
		if (radio_button_state() === 'Linear') {
			net = linear_net;
			trainer = linear_trainer;
			plot_contour(train_loss_plotter, linear_train_contour_data,
				train_contour_color, train_contour_scale);
			plot_contour(valid_loss_plotter, linear_valid_contour_data,
				valid_contour_color, valid_contour_scale);
		} else if (radio_button_state() === 'Deep') {
			net = deep_net;
			trainer = deep_trainer;
			plot_contour(train_loss_plotter, deep_train_contour_data,
				train_contour_color, train_contour_scale);
			plot_contour(valid_loss_plotter, deep_valid_contour_data,
				valid_contour_color, valid_contour_scale);
		} else {
			net = shallow_net;
			trainer = shallow_trainer;
			plot_contour(train_loss_plotter, shallow_train_contour_data,
				train_contour_color, train_contour_scale);
			plot_contour(valid_loss_plotter, shallow_valid_contour_data,
				valid_contour_color, valid_contour_scale);
		}
		clear();
		plot();
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
		curve_plotter.add_group("fixed");
		train_loss_plotter.add_group("contour");
		valid_loss_plotter.add_group("contour");
		curve_plotter.add_group("float")
		train_loss_plotter.add_group("float");
		valid_loss_plotter.add_group("float");
		graph_plotter.add_group("float");
		train_loss_plotter.add_x_axis_label("w1");
		train_loss_plotter.add_y_axis_label("w2");
		valid_loss_plotter.add_x_axis_label("w1");
		valid_loss_plotter.add_y_axis_label("w2");
		initial_plot();
	}

	function make_deep_net() {
		var layer_defs = [];
		layer_defs.push({
			type: 'input',
			out_sx: 1,
			out_sy: 1,
			out_depth: 1
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: 2,
			activation: 'tanh'
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: 4,
			activation: 'tanh'
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: 4,
			activation: 'tanh'
		});
		layer_defs.push({
			type: 'regression',
			num_neurons: 1
		});
		var new_net = new net_lib.Net();
		new_net.makeLayers(layer_defs);
		if (!obtaining_param) {
			new_net.getLayer(1).setWeights([[-0.2], [-0.2]]);
			new_net.getLayer(3).setWeights(param.opt_layer3_w);
			new_net.getLayer(5).setWeights(param.opt_layer5_w);
			new_net.getLayer(7).setWeights(param.opt_layer7_w);
			new_net.getLayer(1).setBiases(param.opt_layer1_b);
			new_net.getLayer(3).setBiases(param.opt_layer3_b);
			new_net.getLayer(5).setBiases(param.opt_layer5_b);
			new_net.getLayer(7).setBiases(param.opt_layer7_b);
		}
		return new_net;
	}

	function make_shallow_net() {
		var layer_defs = [];
		layer_defs.push({
			type: 'input',
			out_sx: 1,
			out_sy: 1,
			out_depth: 1
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: 2,
			activation: 'tanh'
		});
		layer_defs.push({
			type: 'regression',
			num_neurons: 1
		});
		var new_net = new net_lib.Net();
		new_net.makeLayers(layer_defs);
		new_net.getLayer(1).setWeights([[-0.2], [-0.2]]);
		new_net.getLayer(1).setBiases([0, 0]);
		new_net.getLayer(3).setWeights([[0.2637135, 0.51581102]]);
		new_net.getLayer(3).setBiases([0.1]);
		return new_net;
	}

	function make_linear_net() {
		var layer_defs = [];
		layer_defs.push({
			type: 'input',
			out_sx: 1,
			out_sy: 1,
			out_depth: 1
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: 2
		});
		layer_defs.push({
			type: 'regression',
			num_neurons: 1
		});
		var new_net = new net_lib.Net();
		new_net.makeLayers(layer_defs);
		new_net.getLayer(1).setWeights([[-0.2], [-0.2]]);
		new_net.getLayer(1).setBiases([0, 0]);
		new_net.getLayer(2).setWeights([[0.2637135, 0.51581102]]);
		new_net.getLayer(2).setBiases([0.1]);
		return new_net;
	}

	function initial_plot() {
		var deep_dummy_net = make_deep_net();
		var shallow_dummy_net = make_shallow_net();
		var linear_dummy_net = make_linear_net();
		for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
			for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
				deep_train_contour_data[k] = compute_training_loss(deep_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
				deep_valid_contour_data[k] = compute_validation_loss(deep_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
				shallow_train_contour_data[k] = compute_training_loss(shallow_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
				shallow_valid_contour_data[k] = compute_validation_loss(shallow_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
				linear_train_contour_data[k] = compute_training_loss(linear_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
				linear_valid_contour_data[k] = compute_validation_loss(linear_dummy_net,
					inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor)
				);
			}
		}
		plot_contour(train_loss_plotter, deep_train_contour_data, train_contour_color,
			train_contour_scale);
		plot_contour(valid_loss_plotter, deep_valid_contour_data, valid_contour_color,
			valid_contour_scale);
		plot_train_and_valid_points();
	}

	function plot_train_and_valid_points() {
		// individual training and validation points
		training_points_data = [];
		// training data points
		for (var i = 0; i < param.train_points.length; i++) {
			training_points_data.push({
				x: param.train_points[i],
				y: Math.sin(param.train_points[i]) + param.train_noise[i]
			});
		}
		validation_points_data = [];
		// training data points
		for (var i = 0; i < param.validation_points.length; i++) {
			validation_points_data.push({
				x: param.validation_points[i],
				y: Math.sin(param.validation_points[i]) + param.validation_noise[i]
			});
		}
		curve_plotter.plot_points(training_points_data, {
			stroke: "red",
			color: "red",
			size: 4,
			opacity: 1,
			id: "#fixed"
		});
		curve_plotter.plot_points(validation_points_data, {
			stroke: "green",
			color: "green",
			size: 4,
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

	function pause_training() {
		if (timer) {
			timer.stop();
			timer = undefined;
		}
	}

	function plot_line() {
		var pred = [];
		var predicted_value;
		var x_val;
		for (var i = -5; i <= 5; i += param.step_size) {
			x_val = new net_lib.Vol([i]);
			predicted_value = net.forward(x_val);
			pred.push({
				x: i,
				y: predicted_value.w[0]
			});
		}
		curve_plotter.plot_line(pred, {
			color: "darkorange",
			width: 3,
			opacity: 1,
			id: "#float"
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
			size: 5,
			opacity: 1,
			id: "#float",
			on_drag: on_drag,
			dragging: dragging,
			end_drag: end_drag,
			mouseover: mouseover,
			mouseout: mouseout
		});
		valid_loss_plotter.plot_points(data, {
			stroke: "black",
			color: "darkslategray",
			size: 5,
			opacity: 1,
			id: "#float",
			on_drag: on_drag,
			dragging: dragging,
			end_drag: end_drag,
			mouseover: mouseover,
			mouseout: mouseout
		});
	}

	function clear() {
		curve_plotter.svg.select("#float").selectAll("*").remove();
		train_loss_plotter.svg.select("#float").selectAll("*").remove();
		valid_loss_plotter.svg.select("#float").selectAll("*").remove();
		graph_plotter.svg.select("#float").selectAll("*").remove();
	}

	function on_drag(d) {
		d3.select(this).raise().classed("active", true);
		pause_training();
	}

	function dragging(d) {
		var new_x = d3.event.x;
		var new_y = d3.event.y;
		d3.select(this).attr("cx", new_x).attr("cy", new_y);
		net.getLayer(1).setWeights([
            [inv_x_scale(new_x)],
            [inv_y_scale(new_y)]
        ]);
		clear();
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
		train: train,
		plot: plot,
		reset: reset,
		update: update
	};
}