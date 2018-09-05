var curve_x = new Array(100);
for (var i = -5, n = 0; i <= 5; i += param.step_size, n++) {
	curve_x[n] = i;
}

var curve_x_extended = new Array(100);
for (var i = -10, n = 0; i <= 10; i += param.step_size * 2, n++) {
	curve_x_extended[n] = i;
}

var training_points_data = train_xs.map((x, i) => {
	return {
        x: train_xs[i],
        y: train_ys[i]
    };
})

var experiment_points_data = new Array(experiment_xs.length);
for (var i = 0; i < experiment_xs.length; i++) {
    experiment_points_data[i] = {
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

// scales
var divergence_fill_color = d3.scaleLinear().domain([-50, 0]).interpolate(function() {
    return d3.interpolateRdYlGn;
});

var train_contour_color = d3.scaleLinear().domain([-1, 0]).interpolate(function() {
    return d3.interpolateSpectral;
});
var valid_contour_color = d3.scaleLinear().domain([-1, 0]).interpolate(function() {
    return d3.interpolateSpectral;
});

var train_contour_scale = d3.contours().size([param.n, param.m]).thresholds(d3.range(0, 1, 0.02));
var valid_contour_scale = d3.contours().size([param.n, param.m]).thresholds(d3.range(0, 1, 0.02));

var train_contour_scale_cc = d3.contours().size([param.n_cc, param.m_cc]).thresholds(d3.range(0, 1, 0.05));
var valid_contour_scale_cc = d3.contours().size([param.n_cc, param.m_cc]).thresholds(d3.range(0, 1, 0.05));

var classification_contour_scale_cc = d3.contours().size([100, 100]).thresholds(d3.range(0.999, 2.001, 0.99));
var classification_contour_color = d3.scaleLinear().domain([0.999, 2.001]).interpolate(function() {
    return d3.interpolateRdBu;
});
var classification_contour_loss_scale = d3.contours().size([param.n, param.m]).thresholds(d3.range(0, 1, 0.01));
var classification_contour_loss_color = d3.scaleLinear().domain([-1, -0.5]).interpolate(function() {
    return d3.interpolateSpectral;
});
