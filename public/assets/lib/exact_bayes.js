function exact_bayes(div, train_posterior_div, valid_posterior_div, progress_div) {

    //svg properties
    var w = 984
    var h = 300
    var w_loss = 600
    var h_loss = 600

    //for contour diagram effective size
    var n = 75;
    var m = 75;

    var step_size = 0.1;
    var div = div;
    var train_posterior_div = train_posterior_div;
    var valid_posterior_div = valid_posterior_div;
    var progress_div = progress_div;

    var svg = div.append("svg");
    var svg2 = train_posterior_div.append("svg");
    var svg3 = valid_posterior_div.append("svg");
    var svg4 = progress_div.append("svg");
    svg.attr("width", w)
    .attr("height", h);
    svg2.attr("width", w_loss)
    .attr("height", h_loss);
    svg3.attr("width", w_loss)
    .attr("height", h_loss);
    svg4.attr("width", w)
    .attr("height", h);

    var curve_domain_x = [-5,5];
    var curve_domain_y = [-2,2];
    var loss_domain_x = [-4,4];
    var loss_domain_y = [-4,4];
    var progress_domain_x = [0,1];
    var progress_domain_y = [20,40];

    var curve_plotter = Plotter(svg, curve_domain_x, curve_domain_y, w, h);
    var train_posterior_plotter = Plotter(svg2, loss_domain_x, loss_domain_y, w_loss, h_loss);
    var valid_posterior_plotter = Plotter(svg3, loss_domain_x, loss_domain_y, w_loss, h_loss);
    var progress_plotter = Plotter(svg4, progress_domain_x, progress_domain_y, w, h);

    var x_scale_loss_inverse = d3.scaleLinear().domain([0, w_loss]).range([-4,4])
    var y_scale_loss_inverse = d3.scaleLinear().domain([h_loss,0]).range([-4,4])

    //hard coded points for consistentcy
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

    var train_posterior_data = new Array(n * m);
    var valid_posterior_data = new Array(n * m);
    var train_sampling_interval = new Array(n * m);
    var valid_sampling_interval = new Array(n * m);

    //hard coded optimum value
    var opt_layer1_w = [[2], [0]];
    var opt_layer1_b = [-1.471708721550612, 1.4638299054171822];

    var opt_layer3_w = [[-3.4756037730352953, -3.1951265117983656], [-0.6023875694498428, 0.742082606972636], [3.2691245346279794, 2.639303322222997], [0.6001228460411082, 1.5988685131936045]];
    var opt_layer3_b = [-0.4959376942683454, -0.38383011398703676, 0.1385379213238358, 0.14474274177948032];

    var opt_layer5_w = [[-0.7608457857739974, -3.807077771966103, 0.15964555671290204, 0.4316940153554302], [-0.46029527392239034, 0.499362627227224, 0.26215741516903984, 0.6087584334472715], [-0.12003663770954856, -2.070047029632726, -0.8253090796194713, -0.5211260899153192], [1.1497913505525421, 3.1232664390054965, 0.31466460121428946, -1.1103448335850838]];
    var opt_layer5_b = [-0.09954752198229085, -0.20782723076897178, 1.0460388498407667, -0.6316497703555812];

    var opt_layer7_w = [[0.16424348634195116, -0.6067898480353261, -1.0202767210893393, -0.7873295687436086]];
    var opt_layer7_b = [0.1996533593619645];

    //define a neural network
    var net = make_preset_net();

    var train_sampled_nets = [];
    var train_sample_predictions = [];
    var avg_pred_by_train = [];
    var train_sampled_weights = [];

    var valid_sampled_nets = [];
    var valid_sample_predictions = [];
    var valid_sampled_weights = [];

    var loss_for_train_samples = [];

    setup();
    initial_plot();

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
        layer_defs.push({type:'fc', num_neurons:2, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'regression', num_neurons:1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        new_net.getLayer(3).setWeights(opt_layer3_w);
        new_net.getLayer(5).setWeights(opt_layer5_w);
        new_net.getLayer(7).setWeights(opt_layer7_w);
        new_net.getLayer(1).setBiases(opt_layer1_b);
        new_net.getLayer(3).setBiases(opt_layer3_b);
        new_net.getLayer(5).setBiases(opt_layer5_b);
        new_net.getLayer(7).setBiases(opt_layer7_b);
        return new_net;
    }

    function setup() {
        var dummy_net = make_preset_net();
        var point_prob_train = 0;
        var point_prob_valid = 0;

        var train_log_sum_exp = 0;
        var valid_log_sum_exp = 0;
        for (var w_2 = 0, k = 0; w_2 < m; w_2++) {
            for (var w_1 = 0; w_1 < n; w_1++, k++) {
                point_prob_train = get_train_posterior(dummy_net, x_scale_loss_inverse(w_1*8), -x_scale_loss_inverse(w_2*8));
                train_posterior_data[k] = point_prob_train;
                train_log_sum_exp += Math.exp(-point_prob_train);
                dummy_net.getLayer(1).setWeights([[x_scale_loss_inverse(w_1*8)], [-x_scale_loss_inverse(w_2*8)]]);
                point_prob_valid = get_valid_posterior(dummy_net);
                valid_posterior_data[k] = point_prob_valid;
                valid_log_sum_exp += Math.exp(-point_prob_valid);
            }
        }
        train_log_sum_exp = Math.log(train_log_sum_exp);
        valid_log_sum_exp = Math.log(valid_log_sum_exp);

        train_sampling_interval[0] = 0;
        valid_sampling_interval[0] = 0;
        for (var i = 1; i < train_sampling_interval.length; i++) {
            train_sampling_interval[i] = train_sampling_interval[i-1] + Math.exp(-train_posterior_data[i] - train_log_sum_exp);
            valid_sampling_interval[i] = valid_sampling_interval[i-1] + Math.exp(-valid_posterior_data[i] - valid_log_sum_exp);
        }
    }

    function reset() {
        train_sampled_nets = [];
        valid_sampled_nets = [];
        train_sampled_weights = [];
        valid_sampled_weights = [];
        train_sample_predictions = [];
        avg_pred_by_train = [];
        valid_sample_predictions = [];
        loss_for_train_samples = [];
        clear();
        plot();
    }

    function sample_train() {
        var uniform = Math.random();
        for (var i = 0; uniform > train_sampling_interval[i]; i++) {}
        var n_sampled = i % m;
        var m_sampled = (i-n_sampled)/n;
        train_sampled_weights.push({
            x: x_scale_loss_inverse(n_sampled*8),
            y: -x_scale_loss_inverse(m_sampled*8)
        });
        var sampled_net = make_preset_net();
        sampled_net.getLayer(1).setWeights([[x_scale_loss_inverse(n_sampled*8)], [-x_scale_loss_inverse(m_sampled*8)]]);
        train_sampled_nets.push(sampled_net);

        point_predictions = predicted_points(sampled_net)
        train_sample_predictions.push(point_predictions);

        if (avg_pred_by_train.length == 0) {
            console.log("triggered");
            avg_pred_by_train = point_predictions;
        } else {
            for (var i = 0; i < avg_pred_by_train.length; i++) {
                avg_pred_by_train[i].y = avg_pred_by_train[i].y * (train_sampled_nets.length-1)/train_sampled_nets.length + point_predictions[i].y/train_sampled_nets.length;
            }
        }

        //compute the loss for the average curve
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        for (var j = 0; j < validation_points.length; j++) {
            x_val = new net_lib.Vol([validation_points[j]]);
            true_label = Math.sin(validation_points[j]) + noise_validation[j];
            total_loss += (true_label - avg_pred_by_train[j].y) * (true_label - avg_pred_by_train[j].y);
        }
        loss_for_train_samples.push(total_loss);
        clear();
        plot();
    }

    function sample_valid() {
        var uniform = Math.random();
        var i;
        for (i = 0; uniform > valid_sampling_interval[i]; i++) {}
        var n_sampled = i % m;
        var m_sampled = (i-n_sampled)/n;
        valid_sampled_weights.push({
            x: x_scale_loss_inverse(n_sampled*8),
            y: -x_scale_loss_inverse(m_sampled*8)
        });
        var sampled_net = make_preset_net();
        sampled_net.getLayer(1).setWeights([[x_scale_loss_inverse(n_sampled*8)], [-x_scale_loss_inverse(m_sampled*8)]]);
        valid_sampled_nets.push(sampled_net);
        valid_sample_predictions.push(predicted_points(sampled_net));
        clear();
        plot();
    }

    function predicted_points(net) {
        points = [];
        for (var j = -6; j < 6; j+=step_size) {
            x_val = new net_lib.Vol([j]);
            predicted_value = net.forward(x_val);
            points.push({x:j,y:predicted_value.w[0]});
        }
        return points;
    }

    function plot() {
        plot_line();
        plot_weight();
    }

    function plot_line() {
        for (var i = 0; i < train_sample_predictions.length; i++) {
            curve_plotter.plot_line(train_sample_predictions[i], "darkorange", 1, 0.2);
        }
        for (var i = 0; i < valid_sample_predictions.length; i++) {
            curve_plotter.plot_line(valid_sample_predictions[i], "darkblue", 1, 0.2);
        }

        var avg_loss_data = [];
        for (var i = 0; i < loss_for_train_samples.length; i++) {
            avg_loss_data.push({x:(i+1)/(loss_for_train_samples.length+1), y:loss_for_train_samples[i]});
        }
        console.log(avg_loss_data);
        progress_plotter.plot_line(avg_loss_data, "black", 3, 1);
        // Also plot the average over sampled nets from training posterior
        curve_plotter.plot_line(avg_pred_by_train, "red", 3, 1);
    }

    function plot_weight() {
        train_posterior_plotter.plot_points(
            data=train_sampled_weights,
            stroke="black",
            color="darkorange",
            size=5,
            opacity=1,
        );
        valid_posterior_plotter.plot_points(
            data=valid_sampled_weights,
            stroke="black",
            color="darkblue",
            size=5,
            opacity=1,
        );
    }

    function clear() {
        svg.selectAll("path").remove();
        svg2.selectAll("circle").remove();
        svg3.selectAll("circle").remove();
        svg4.selectAll("path").remove();
    }

    function initial_plot() {
        plot_train_and_valid_points();
        plot_train_posterior();
        plot_valid_posterior();
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
        curve_plotter.plot_points(training_points_data, "red", "red", 4, 1);
        curve_plotter.plot_points(validation_points_data, "green", "green", 4, 0.3);
    }

    function plot_train_posterior() {
        var color = d3.scaleLog()
            .domain([1,100])
            .interpolate(function() { return d3.interpolateSpectral; });
        var contours = d3.contours()
            .size([n, m])
            .thresholds(d3.range(0.01, 500, .5));

        var new_data = new Array(n*m);
        for (var i = 0; i < train_posterior_data.length; i++) {
            new_data[i] = train_posterior_data[i] * validation_points.length / train_points.length;
        }

        train_posterior_plotter.plot_contour(
            data=new_data,
            n=n,
            m=m,
            color_scale=color,
            contour_scale=contours
        );
    }

    function plot_valid_posterior() {
        var color = d3.scaleLog()
            .domain([1,100])
            .interpolate(function() { return d3.interpolateSpectral; });
        var contours = d3.contours()
            .size([n, m])
            .thresholds(d3.range(0.01, 500, .5));

        valid_posterior_plotter.plot_contour(
            data=valid_posterior_data,
            n=n,
            m=m,
            color_scale=color,
            contour_scale=contours
        );
    }

    function get_valid_posterior(dummy_net) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        for (var j = 0; j < validation_points.length; j++) {
            x_val = new net_lib.Vol([validation_points[j]]);
            true_label = Math.sin(validation_points[j]) + noise_validation[j];
            predicted = dummy_net.forward(x_val).w[0];
            total_loss += (true_label - predicted) * (true_label - predicted);
        }
        return total_loss;
    }

    function get_train_posterior(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]]);
        for (var i = 0; i < train_points.length; i++) {
            x_val = new net_lib.Vol([train_points[i]]);
            true_label = Math.sin(train_points[i]) + noise_train[i];
            predicted = dummy_net.forward(x_val).w[0];
            total_loss += (true_label - predicted) * (true_label - predicted);
        }
        return total_loss;
    }

    return {
        plot: plot,
        sample_train: sample_train,
        sample_valid: sample_valid,
        reset: reset
    };
}
