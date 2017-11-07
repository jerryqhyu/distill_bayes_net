function mlp(div, train_loss_div, valid_loss_div, parameters) {

    var svg = div.append("svg").attr("width", parameters.w).attr("height", parameters.h);
    var svg2 = train_loss_div.append("svg").attr("width", parameters.w_loss).attr("height", parameters.h_loss);
    var svg3 = valid_loss_div.append("svg").attr("width", parameters.w_loss).attr("height", parameters.h_loss);
    var curve_plotter = Plotter(svg, parameters.curve_domain_x, parameters.curve_domain_y, parameters.w, parameters.h);
    var train_loss_plotter = Plotter(svg2, parameters.loss_domain_x, parameters.loss_domain_y, parameters.w_loss, parameters.h_loss);
    var valid_loss_plotter = Plotter(svg3, parameters.loss_domain_x, parameters.loss_domain_y, parameters.w_loss, parameters.h_loss);
    var x_scale_loss_inverse = d3.scaleLinear().domain([0, parameters.w_loss]).range(parameters.loss_domain_x)
    var y_scale_loss_inverse = d3.scaleLinear().domain([parameters.h_loss, 0]).range(parameters.loss_domain_y)
    var train_contour_data = new Array(parameters.n * parameters.m);
    var valid_contour_data = new Array(parameters.n * parameters.m);

    var opt_first = [[1], [1]
    ]; // this is because of js aliasing

    //define a neural network
    var net = make_preset_net();

    var trainer = new net_lib.Trainer(net, {
        method: 'sgd',
        learning_rate: parameters.learning_rate,
        momentum: parameters.momentum,
        batch_size: parameters.batch_size
    });

    //interval controller
    var timer;
    var epoch_count = 0;
    var obtaining_param = 0;

    setup();
    initial_plot();

    function setup() {
        var dummy_net = make_preset_net();
        for (var w_2 = 0, k = 0; w_2 < parameters.m; w_2++) {
            for (var w_1 = 0; w_1 < parameters.n; w_1++, k++) {
                train_contour_data[k] = compute_training_loss(dummy_net, x_scale_loss_inverse(w_1 * parameters.scaling_factor), y_scale_loss_inverse(w_2 * parameters.scaling_factor))
                valid_contour_data[k] = compute_validation_loss(dummy_net, x_scale_loss_inverse(w_1 * parameters.scaling_factor), y_scale_loss_inverse(w_2 * parameters.scaling_factor));
            }
        }
        initial_plot();
    }

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: 1});
        layer_defs.push({type: 'fc', num_neurons: 2, activation: 'tanh'});
        layer_defs.push({type: 'fc', num_neurons: 4, activation: 'tanh'});
        layer_defs.push({type: 'fc', num_neurons: 4, activation: 'tanh'});
        layer_defs.push({type: 'regression', num_neurons: 1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        if (!obtaining_param) {
            opt_first = [[1], [1]
            ];
            new_net.getLayer(1).setWeights(opt_first);
            new_net.getLayer(3).setWeights(parameters.opt_layer3_w);
            new_net.getLayer(5).setWeights(parameters.opt_layer5_w);
            new_net.getLayer(7).setWeights(parameters.opt_layer7_w);
            new_net.getLayer(1).setBiases(parameters.opt_layer1_b);
            new_net.getLayer(3).setBiases(parameters.opt_layer3_b);
            new_net.getLayer(5).setBiases(parameters.opt_layer5_b);
            new_net.getLayer(7).setBiases(parameters.opt_layer7_b);
        }
        return new_net;
    }

    function reset() {
        net = make_preset_net();
        trainer = new net_lib.Trainer(net, {
            method: 'sgd',
            learning_rate: parameters.learning_rate,
            momentum: parameters.momentum,
            batch_size: parameters.batch_size
        });
        clear();
        plot();
        pause_training();
        epoch_count = 0;
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
        for (var j = 0; j < parameters.train_points.length; j++) {
            x = new net_lib.Vol([parameters.train_points[j]]);
            trainer.train(x, [Math.sin(parameters.train_points[j]) + parameters.train_noise[j]]);
        }
        if (obtaining_param) {
            for (var j = 0; j < parameters.validation_points.length; j++) {
                x = new net_lib.Vol([parameters.validation_points[j]]);
                trainer.train(x, [Math.sin(parameters.validation_points[j]) + parameters.validation_noise[j]]);
            }
        }
        clear();
        plot();
        epoch_count++;
    }

    function pause_training() {
        if (timer) {
            timer.stop();
            timer = undefined;
        }
    }

    function plot() {
        plot_line();
        plot_weight();
    }

    function plot_line() {
        var pred = [];
        var predicted_value;
        var x_val;
        for (var i = -6; i < 6; i += parameters.step_size) {
            x_val = new net_lib.Vol([i]);
            predicted_value = net.forward(x_val);
            pred.push({x: i, y: predicted_value.w[0]});
        }
        curve_plotter.plot_line(pred, {
            color: "darkorange",
            width: 2,
            opacity: 1
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
            on_drag: on_drag,
            dragging: dragging,
            end_drag: end_drag
        });
        valid_loss_plotter.plot_points(data, {
            stroke: "black",
            color: "darkslategray",
            size: 5,
            opacity: 1,
            on_drag: on_drag,
            dragging: dragging,
            end_drag: end_drag
        });
    }

    function clear() {
        svg.selectAll("path").remove();
        svg2.selectAll("circle").remove();
        svg3.selectAll("circle").remove();
    }

    function initial_plot() {
        plot_train_and_valid_points();
        plot_train_contour();
        plot_valid_contour();
    }

    function plot_train_and_valid_points() {
        //individual training and validation points
        training_points_data = [];
        //training data points
        for (var i = 0; i < parameters.train_points.length; i++) {
            training_points_data.push({
                x: parameters.train_points[i],
                y: Math.sin(parameters.train_points[i]) + parameters.train_noise[i]
            });
        }
        validation_points_data = [];
        //training data points
        for (var i = 0; i < parameters.validation_points.length; i++) {
            validation_points_data.push({
                x: parameters.validation_points[i],
                y: Math.sin(parameters.validation_points[i]) + parameters.validation_noise[i]
            });
        }
        curve_plotter.plot_points(training_points_data, {
            stroke: "red",
            color: "red",
            width: 3,
            opacity: 1
        });
        curve_plotter.plot_points(validation_points_data, {
            stroke: "green",
            color: "green",
            width: 3,
            opacity: 0.5
        });
    }

    function plot_train_contour() {
        var color = d3.scaleLinear().domain([-0.1, 2]).interpolate(function() {
            return d3.interpolateSpectral;
        });
        var contours = d3.contours().size([parameters.n, parameters.m]).thresholds(d3.range(0.1, 5, 0.1));
        train_loss_plotter.plot_contour(train_contour_data, {
            n: parameters.n,
            m: parameters.m,
            color_scale: color,
            contour_scale: contours
        });
    }

    function plot_valid_contour() {
        var color = d3.scaleLinear().domain([0, 12]).interpolate(function() {
            return d3.interpolateSpectral;
        });
        var contours = d3.contours().size([parameters.n, parameters.m]).thresholds(d3.range(0.1, 50, 0.5));
        valid_loss_plotter.plot_contour(valid_contour_data, {
            n: parameters.n,
            m: parameters.m,
            color_scale: color,
            contour_scale: contours
        });
    }

    function compute_validation_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]
        ]);
        for (var j = 0; j < parameters.validation_points.length; j++) {
            x_val = new net_lib.Vol([parameters.validation_points[j]]);
            true_label = Math.sin(parameters.validation_points[j]) + parameters.validation_noise[j];
            total_loss += dummy_net.getCostLoss(x_val, true_label);
        }
        return total_loss;
    }

    function compute_training_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]
        ]);
        for (var i = 0; i < parameters.train_points.length; i++) {
            x_val = new net_lib.Vol([parameters.train_points[i]]);
            true_label = Math.sin(parameters.train_points[i]) + parameters.train_noise[i];
            total_loss += dummy_net.getCostLoss(x_val, true_label);
        }
        return total_loss;
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
            [x_scale_loss_inverse(new_x)],
            [y_scale_loss_inverse(new_y)]
        ]);
        clear();
        plot();
    }

    function end_drag(d) {
        d3.select(this).raise().classed("active", false);
    }

    return {train: train, plot: plot, reset: reset};
}
