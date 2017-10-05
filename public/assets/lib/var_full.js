function var_full(div, train_loss_div, valid_loss_div) {

    //svg properties
    var w = 984
    var h = 300
    var w_loss = 300
    var h_loss = 300

    var step_size = 0.1;
    var div = div;
    var train_loss_div = train_loss_div;
    var valid_loss_div = valid_loss_div;

    var svg = div.append("svg");
    var svg2 = train_loss_div.append("svg");
    var svg3 = valid_loss_div.append("svg");
    svg.attr("width", w)
    .attr("height", h);
    svg2.attr("width", w_loss)
    .attr("height", h_loss);
    svg3.attr("width", w_loss)
    .attr("height", h_loss);

    //for contour plot
    var n = 75;
    var m = 75;

    var obtaining_param = 0;

    var curve_domain_x = [-5,5];
    var curve_domain_y = [-2,2];
    var loss_domain_x = [-4,4];
    var loss_domain_y = [-4,4];

    var curve_plotter = Plotter(svg, curve_domain_x, curve_domain_y, w, h);
    var train_loss_plotter = Plotter(svg2, loss_domain_x, loss_domain_y, w_loss, h_loss);
    var valid_loss_plotter = Plotter(svg3, loss_domain_x, loss_domain_y, w_loss, h_loss);

    var x_scale_loss_inverse = d3.scaleLinear().domain([0, w_loss]).range([-4,4])
    var y_scale_loss_inverse = d3.scaleLinear().domain([h_loss,0]).range([-4,4])

    //hard coded points for consistentcy
    seeds = ["wow", "undertale", "bayesian", "toronto", "iphonex"];
    // seeds = ["wow", "wow", "wow", "wow", "wow"];
    var train_points = [ 0.98348382,  0.33239784, 1.31901198,
      -1.33424016, -2.49962207, 2.671385];
    var validation_points = [0.0074539 , -2.25649362,  1.2912101 ,         -1.15521679,  0.15278725,
        2.0997623 ,  1.47247248, -1.05303993,  0.4568989 , -0.61385536,
       -2.18751186,  1.26085173, -2.8500024 ,  2.59464658,  2.64281159,
       -2.93701525,  0.7578316 ,  2.49371189,  2.43455803, -1.30204828,
       -0.72566079, -2.53146956,  2.37625046, -1.46966588, -1.83330212,
        2.57031247, -1.91009532, -2.41233259, -0.44398402,  1.06769911,
        2.32972244, -1.84966642,  2.53616255,  0.42077324,  0.4261107 ,
        1.42198161,  2.72728906, -1.71100897, -1.59204741,  1.2299973 ,
        0.37747723,  0.32106662,  0.07131672,  0.03220256, -1.37330352,
        1.47470907,  2.19194335, -0.77412576, -1.29907828, -2.64114398];

    var noise_train = [-0.24911933, -0.18541917,  0.37738159,  0.16834003,  0.39383113,
        0.37258389];
    var noise_validation = [-0.09674867,  0.02199221,  0.14537768, -0.11992788,  0.09587188,
        0.04348861,  0.26443214, -0.04382649, -0.02890301, -0.00131674,
        0.09219836,  0.05413551,  0.10605215,  0.03032372,  0.04228423,
        0.07250382,  0.01140705, -0.01311484,  0.04177916, -0.10178443,
       -0.21569761,  0.01565909, -0.27418905, -0.03551064,  0.02892201,
        0.05344915, -0.05026234,  0.18413039, -0.11663553,  0.0162466 ,
       -0.16556253, -0.04830382,  0.24141434,  0.09317031,  0.00835115,
        0.11408831,  0.10949991, -0.03641678, -0.14478094,  0.0234874 ,
       -0.07348802,  0.14804239, -0.23464277,  0.01217727,  0.00439172,
       -0.20313738,  0.09017244,  0.08452561,  0.0044375 ,  0.09312328];

    //hard coded optimum value
    var opt_layer1_b = [-1.471708721550612, 1.4638299054171822];

    var opt_layer3_w = [[-3.4756037730352953, -3.1951265117983656], [-0.6023875694498428, 0.742082606972636], [3.2691245346279794, 2.639303322222997], [0.6001228460411082, 1.5988685131936045]];
    var opt_layer3_b = [-0.4959376942683454, -0.38383011398703676, 0.1385379213238358, 0.14474274177948032];

    var opt_layer5_w = [[-0.7608457857739974, -3.807077771966103, 0.15964555671290204, 0.4316940153554302], [-0.46029527392239034, 0.499362627227224, 0.26215741516903984, 0.6087584334472715], [-0.12003663770954856, -2.070047029632726, -0.8253090796194713, -0.5211260899153192], [1.1497913505525421, 3.1232664390054965, 0.31466460121428946, -1.1103448335850838]];
    var opt_layer5_b = [-0.09954752198229085, -0.20782723076897178, 1.0460388498407667, -0.6316497703555812];

    var opt_layer7_w = [[0.16424348634195116, -0.6067898480353261, -1.0202767210893393, -0.7873295687436086]];
    var opt_layer7_b = [0.1996533593619645];

    var train_contour_data = new Array(n * m);
    var valid_contour_data = new Array(n * m);

    //define a neural network
    var net = make_preset_net();
    var epoch_count = 0;
    var learning_rate = 0.01;
    var l1_decay = 0;
    var l2_decay = 0;
    var momentum = 0;
    var batch_size = 16;

    var trainer = new net_lib.Trainer(net, {method: 'sgd', learning_rate: learning_rate,
    l2_decay: l2_decay, momentum: momentum, batch_size: batch_size,
    l1_decay: l1_decay});

    //interval controller
    var currently_training = 0;
    var was_training = 0;

    setup();
    initial_plot();

    function setup() {
        var dummy_net = make_preset_net();
        for (var w_2 = 0, k = 0; w_2 < m; w_2++) {
            for (var w_1 = 0; w_1 < n; w_1++, k++) {
                train_contour_data[k] = compute_training_loss(dummy_net, x_scale_loss_inverse(w_1*4), -x_scale_loss_inverse(w_2*4));
                valid_contour_data[k] = compute_validation_loss(dummy_net, x_scale_loss_inverse(w_1*4), -x_scale_loss_inverse(w_2*4));
            }
        }
        train_loss_plotter.add_group("contours");
        valid_loss_plotter.add_group("contours");
        train_loss_plotter.add_group("var_dists");
        valid_loss_plotter.add_group("var_dists");

    }

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
        layer_defs.push({type:'variational', num_neurons:2, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'regression', num_neurons:1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        if (!obtaining_param) {
            //set the params for later layers
            new_net.getLayer(3).setWeights(opt_layer3_w);
            new_net.getLayer(5).setWeights(opt_layer5_w);
            new_net.getLayer(7).setWeights(opt_layer7_w);
            new_net.getLayer(1).setBiases(opt_layer1_b);
            new_net.getLayer(3).setBiases(opt_layer3_b);
            new_net.getLayer(5).setBiases(opt_layer5_b);
            new_net.getLayer(7).setBiases(opt_layer7_b);
        }
        return new_net;
    }

    function reset() {
        net = make_preset_net();
        trainer = new net_lib.Trainer(net, {method: 'sgd', learning_rate: learning_rate,
        l2_decay: l2_decay, momentum: momentum, batch_size: batch_size,
        l1_decay: l1_decay});
        clear();
        plot();
        pause_training();
        epoch_count = 0;
    }

    function train() {
        if (!currently_training) {
            console.log("started training");
            if (obtaining_param) {
                net.getLayer(1).freeze_weights();
            } else {
                net.freezeAllButX(1);
            }
            currently_training = setInterval(train_epoch, 50);
        }
    }

    function train_epoch() {
        var x;
        for (var j = 0; j < train_points.length; j++) {
            x = new net_lib.Vol([train_points[j]]);
            trainer.train(x, [Math.sin(train_points[j])+noise_train[j]]);
        }
        if (obtaining_param) {
            for (var j = 0; j < validation_points.length; j++) {
                x = new net_lib.Vol([validation_points[j]]);
                trainer.train(x, [Math.sin(validation_points[j])+noise_validation[j]]);
            }
            if (epoch_count % 100 == 0) {
                console.log(epoch_count);
            }
            if (epoch_count === 500) {
                for (var i = 0; i < net.layers.length; i++) {
                    layer = net.getLayer(i);
                    if (layer.filters) {
                        console.log("This is layer" + i);
                        console.log("Biases");
                        console.log(layer.biases.w);
                        for (var j = 0; j < layer.filters.length; j++) {
                            console.log(layer.filters[j].w);
                        }
                    }
                }
            }
        }
        clear();
        plot();
        epoch_count++;
    }

    function pause_training() {
        if (currently_training) {
            clearInterval(currently_training);
            currently_training = 0;
        }
    }

    function plot() {
        plot_line();
        plot_variational_distribution();
    }

    function plot_line() {
        var predicted_value;
        var x_val;
        var pred = [];
        for (var i = 0; i < seeds.length; i++) {
            pred.push([]);
            sampled_net = net.sampleNet(seeds[i]);
            for (var j = -6; j < 6; j+=step_size) {
                x_val = new net_lib.Vol([j]);
                predicted_value = sampled_net.forward(x_val);
                pred[i].push({x:j,y:predicted_value.w[0]});
            }
            curve_plotter.plot_line(pred[i], "orange", 1, 0.5);
        }
        mean = [];
        for (var i = -6; i < 6; i+=step_size) {
            x_val = new net_lib.Vol([i]);
            predicted_value = net.forward(x_val);
            mean.push({x:i,y:predicted_value.w[0]});
        }
        curve_plotter.plot_line(mean, "red", 2);

        //individual training and validation points
        training_points_data = [];
        for (var i = 0; i < train_points.length; i++) {
            training_points_data.push({
                x: train_points[i],
                y: Math.sin(train_points[i])+noise_train[i]
            });
        }
        validation_points_data = [];
        for (var i = 0; i < validation_points.length; i++) {
            validation_points_data.push({
                x: validation_points[i],
                y: Math.sin(validation_points[i])+noise_validation[i]
            });
        }

        curve_plotter.plot_points(training_points_data, "red", 3, 1);
        curve_plotter.plot_points(validation_points_data, "green", 3, 0.3);
    }

    function get_curve() {
        var data = {};
        var real = [];
        var pred = [];
        var predicted_value;
        var x_val;
        for (var i = -6; i < 6; i+=step_size) {
            real.push({x:i,y:Math.sin(i)});
            x_val = new net_lib.Vol([i]);
            predicted_value = net.forward(x_val);
            pred.push({x:i,y:predicted_value.w[0]});
        }
        data.real = real;
        data.pred = pred;
        return data;
    }

    function plot_variational_distribution() {
        var mean = [net.getLayer(1).mean[0].w[0], net.getLayer(1).mean[1].w[0]];
        var std = [net.getLayer(1).std[0].w[0], net.getLayer(1).std[1].w[0]];

        // mean = [0,0];
        // std = [1,1];

        var n = 75;
        var m = 75;
        var data = new Array(n * m);
        for (var w_2 = 0, k = 0; w_2 < m; w_2++) {
            for (var w_1 = 0; w_1 < n; w_1++, k++) {
                data[k] = (1/(std[0]*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(x_scale_loss_inverse(w_1*4)-mean[0],2)/ (2*(std[0]*std[0])))) * (1/(std[1]*Math.sqrt(Math.PI*2)))*Math.exp(-(Math.pow(-x_scale_loss_inverse(w_2*4)-mean[1],2)/ (2*(std[1]*std[1]))))
            }
        }

        console.log(data);

        var color = d3.scaleLinear()
            .domain([0,1])
            .interpolate(function() { return d3.interpolateGreys; });

        var contours = d3.contours()
            .size([n, m])
            .thresholds(d3.range(1e-20, 0.3, 0.01));

        train_loss_plotter.plot_contour(
            data=data,
            n=n,
            m=m,
            color_scale=color,
            contour_scale=contours,
            id="#var_dists",
            opacity=0.1,
            stroke="black"
        );

        valid_loss_plotter.plot_contour(
            data=data,
            n=n,
            m=m,
            color_scale=color,
            contour_scale=contours,
            id="#var_dists",
            opacity=0.1,
            stroke="black"
        );

        // console.log(mean);

        //for testing
        train_loss_plotter.plot_points(
            data=[{x:mean[0],y:mean[1]}],
            stroke="black",
            color="black",
            size=5,
            opacity=1,
            );
        valid_loss_plotter.plot_points(
            data=[{x:mean[0],y:mean[1]}],
            stroke="black",
            color="black",
            size=5,
            opacity=1,
            );
    }

    function clear() {
        svg.selectAll("path").remove();
        svg2.selectAll("circle").remove();
        svg3.selectAll("circle").remove();
        svg2.select("#var_dists").selectAll("*").remove();
        svg3.select("#var_dists").selectAll("*").remove();
    }

    function initial_plot() {
        plot_train_and_valid_points();
        plot_train_contour();
        plot_valid_contour();
        plot();
    }

    function plot_train_and_valid_points() {
        //individual training and validation points
        training_points_data = [];
        //training data points
        for (var i = 0; i < train_points.length; i++) {
            training_points_data.push({
                x: train_points[i],
                y: Math.sin(train_points[i])+noise_train[i]
            });
        }
        validation_points_data = [];
        //training data points
        for (var i = 0; i < validation_points.length; i++) {
            validation_points_data.push({
                x: validation_points[i],
                y: Math.sin(validation_points[i])+noise_validation[i]
            });
        }
        curve_plotter.plot_points(training_points_data, "red", "red", 3, 1);
        curve_plotter.plot_points(validation_points_data, "green", "green", 3, 0.5);
    }

    function plot_train_contour() {
        var color = d3.scaleLog()
            .domain([1,100])
            .interpolate(function() { return d3.interpolateSpectral; });
        var contours = d3.contours()
            .size([n, m])
            .thresholds(d3.range(0.1, 500, .5));

        train_loss_plotter.plot_contour(
            data=train_contour_data,
            n=n,
            m=m,
            color_scale=color,
            contour_scale=contours,
            id="#contours"
        );
    }

    function plot_valid_contour() {
        var color = d3.scaleLog()
            .domain([1,100])
            .interpolate(function() { return d3.interpolateSpectral; });
        var contours = d3.contours()
            .size([n, m])
            .thresholds(d3.range(0.01, 500, .5));

        valid_loss_plotter.plot_contour(
            data=valid_contour_data,
            n=n,
            m=m,
            color_scale=color,
            contour_scale=contours,
            id="#contours"
        );
    }

    function compute_validation_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setMeans([[w_1], [w_2]]);
        for (var j = 0; j < validation_points.length; j++) {
            x_val = new net_lib.Vol([validation_points[j]]);
            true_label = Math.sin(validation_points[j]) + noise_validation[j];
            predicted = dummy_net.forward(x_val).w[0];
            total_loss += (true_label - predicted) * (true_label - predicted);
        }
        return total_loss / 1.125;
    }

    function compute_training_loss(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setMeans([[w_1], [w_2]]);
        for (var i = 0; i < train_points.length; i++) {
            x_val = new net_lib.Vol([train_points[i]]);
            true_label = Math.sin(train_points[i]) + noise_train[i];
            predicted = dummy_net.forward(x_val).w[0];
            total_loss += (true_label - predicted) * (true_label - predicted);
        }
        return total_loss * validation_points.length / train_points.length / 1.125;
    }

    function on_drag(d) {
        d3.select(this).raise().classed("active", true);
        if (currently_training) {
            was_training = 1;
        } else {
            was_training = 0;
        }
        pause_training();
    }

    function dragging(d) {
        var new_x = d3.event.x;
        var new_y = d3.event.y;
        d3.select(this).attr("cx", new_x).attr("cy", new_y);
        net.getLayer(1).setMeans([[x_scale_loss_inverse(new_x)], [y_scale_loss_inverse(new_y)]]);
        clear();
        plot();
        console.log(d3.event.x);
    }

    function end_drag(d) {
        d3.select(this).raise().classed("active", false);
        if (was_training) {
            train();
        }
    }

    return {
        train: train,
        plot: plot,
        reset: reset
    };
}
