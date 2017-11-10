function mlp(div, train_loss_div, valid_loss_div) {

    var svg = div.append("svg").attr("width", param.w).attr("height", param.h);
    var svg2 = train_loss_div.append("svg").attr("width", param.w_loss + 20).attr("height", param.h_loss + 20);
    var svg3 = valid_loss_div.append("svg").attr("width", param.w_loss + 20).attr("height", param.h_loss + 20);
    var curve_plotter = Plotter(svg, param.curve_domain_x, param.curve_domain_y, param.w, param.h);
    var train_loss_plotter = Plotter(svg2, param.loss_domain_x, param.loss_domain_y, param.w_loss, param.h_loss);
    var valid_loss_plotter = Plotter(svg3, param.loss_domain_x, param.loss_domain_y, param.w_loss, param.h_loss);
    var train_contour_data = new Array(param.n * param.m);
    var valid_contour_data = new Array(param.n * param.m);

    //define a neural network
    var net = make_preset_net();
    var trainer = new net_lib.Trainer(net, {
        method: 'sgd',
        learning_rate: param.learning_rate,
        momentum: param.momentum,
        batch_size: param.batch_size
    });

    //interval controller
    var timer;
    var epoch_count = 0;
    var obtaining_param = 0;

    setup();
    initial_plot();

    function setup() {
        curve_plotter.add_group("fixed");
        train_loss_plotter.add_group("fixed");
        valid_loss_plotter.add_group("fixed");
        curve_plotter.add_group("float")
        train_loss_plotter.add_group("float");
        valid_loss_plotter.add_group("float");
        var dummy_net = make_preset_net();
        for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
            for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
                train_contour_data[k] = compute_training_loss(dummy_net, x_scale_loss_inverse(w_1 * param.scaling_factor), y_scale_loss_inverse(w_2 * param.scaling_factor))
                valid_contour_data[k] = compute_validation_loss(dummy_net, x_scale_loss_inverse(w_1 * param.scaling_factor), y_scale_loss_inverse(w_2 * param.scaling_factor));
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

    function reset() {
        net = make_preset_net();
        trainer = new net_lib.Trainer(net, {
            method: 'sgd',
            learning_rate: param.learning_rate,
            momentum: param.momentum,
            batch_size: param.batch_size
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
        for (var j = 0; j < param.train_points.length; j++) {
            x = new net_lib.Vol([param.train_points[j]]);
            trainer.train(x, [Math.sin(param.train_points[j]) + param.train_noise[j]]);
        }
        if (obtaining_param) {
            for (var j = 0; j < param.validation_points.length; j++) {
                x = new net_lib.Vol([param.validation_points[j]]);
                trainer.train(x, [Math.sin(param.validation_points[j]) + param.validation_noise[j]]);
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
        for (var i = -6; i < 6; i += param.step_size) {
            x_val = new net_lib.Vol([i]);
            predicted_value = net.forward(x_val);
            pred.push({x: i, y: predicted_value.w[0]});
        }
        curve_plotter.plot_line(pred, {
            color: "darkorange",
            width: 2,
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
        svg.select("#float").selectAll("*").remove();
        svg2.select("#float").selectAll("*").remove();
        svg3.select("#float").selectAll("*").remove();
    }

    function initial_plot() {
        plot_train_and_valid_points();
        plot_train_contour();
        plot_valid_contour();
        train_loss_plotter.add_x_axis_label("w1");
        train_loss_plotter.add_y_axis_label("w2");
        valid_loss_plotter.add_x_axis_label("w1");
        valid_loss_plotter.add_y_axis_label("w2");
    }

    function plot_train_and_valid_points() {
        //individual training and validation points
        training_points_data = [];
        //training data points
        for (var i = 0; i < param.train_points.length; i++) {
            training_points_data.push({
                x: param.train_points[i],
                y: Math.sin(param.train_points[i]) + param.train_noise[i]
            });
        }
        validation_points_data = [];
        //training data points
        for (var i = 0; i < param.validation_points.length; i++) {
            validation_points_data.push({
                x: param.validation_points[i],
                y: Math.sin(param.validation_points[i]) + param.validation_noise[i]
            });
        }
        curve_plotter.plot_points(training_points_data, {
            stroke: "red",
            color: "red",
            width: 3,
            opacity: 1,
            id: "#fixed"
        });
        curve_plotter.plot_points(validation_points_data, {
            stroke: "green",
            color: "green",
            width: 3,
            opacity: 0.5,
            id: "#fixed"
        });
    }

    function plot_train_contour() {
        var color = d3.scaleLinear().domain([-0.1, 2]).interpolate(function() {
            return d3.interpolateSpectral;
        });
        var contours = d3.contours().size([param.n, param.m]).thresholds(d3.range(0.1, 5, 0.1));
        train_loss_plotter.plot_contour(train_contour_data, {
            n: param.n,
            m: param.m,
            color_scale: color,
            contour_scale: contours,
            id: "#fixed"
        });
    }

    function plot_valid_contour() {
        var color = d3.scaleLinear().domain([0, 12]).interpolate(function() {
            return d3.interpolateSpectral;
        });
        var contours = d3.contours().size([param.n, param.m]).thresholds(d3.range(0.1, 50, 0.5));
        valid_loss_plotter.plot_contour(valid_contour_data, {
            n: param.n,
            m: param.m,
            color_scale: color,
            contour_scale: contours,
            id: "#fixed"
        });
    }

    function compute_validation_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]
        ]);
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
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]
        ]);
        for (var i = 0; i < param.train_points.length; i++) {
            x_val = new net_lib.Vol([param.train_points[i]]);
            true_label = Math.sin(param.train_points[i]) + param.train_noise[i];
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
        console.log(x_scale_loss_inverse(new_x));
        console.log(y_scale_loss_inverse(new_y));
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

    function mouseover() {
        d3.select(this).attr("r", 10);
    }

    function mouseout() {
        d3.select(this).attr("r", 5);
    }

    return {train: train, plot: plot, reset: reset};
}
