var curve_x = new Array(100);
for (var i = -5, n = 0; i <= 5; i += param.step_size, n++) {
	curve_x[n] = i;
}

var curve_x_extended = new Array(100);
for (var i = -10, n = 0; i <= 10; i += param.step_size * 2, n++) {
	curve_x_extended[n] = i;
}

var training_points_data = new Array(param.train_points.length);
for (var i = 0; i < training_points_data.length; i++) {
    training_points_data[i] = {
        x: param.train_points[i],
        y: Math.sin(param.train_points[i]) + param.train_noise[i]
    };
}

var experiment_points_date = new Array(experiment_xs.length);
for (var i = 0; i < experiment_xs.length; i++) {
    experiment_points_date[i] = {
        x: experiment_xs[i],
        y: experiment_ys[i]
    };
}

var validation_points_data = new Array(param.validation_points.length);
for (var i = 0; i < validation_points_data.length; i++) {
    validation_points_data[i] = {
        x: param.validation_points[i],
        y: Math.sin(param.validation_points[i]) + param.validation_noise[i]
    };
}

var connection_strength_thickness = d3.scaleLinear().domain([-2.5, 2.5]).range([0.01, 3]);
connection_strength_thickness.clamp(true);

var connection_variation_color = d3.scaleLinear().domain([-1, 1]).interpolate(function() {
    return d3.interpolateYlOrBr;
});
connection_variation_color.clamp(true);
