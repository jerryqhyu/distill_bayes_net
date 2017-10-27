//Supports all plotting functionalities
function Plotter(svg, domain_x, domain_y, width, height) {

    //svg properties
    var svg = svg;
    var domain_x = domain_x;
    var domain_y = domain_y;
    var width = width;
    var height = height;
    var step_size = 0.1;

    //scales from domain/range to width/height of the svg
    var x_scale = d3.scaleLinear().domain(domain_x).range([0, width]);
    var y_scale = d3.scaleLinear().domain(domain_y).range([height, 0]);
    var x_scale_inverse = d3.scaleLinear().domain([0, width]).range(domain_x);
    var y_scale_inverse = d3.scaleLinear().domain([height, 0]).range(domain_y);

    //a line plotter
    var line = d3.line().x(function(d) {
        return x_scale(d.x);
    }).y(function(d) {
        return y_scale(d.y);
    })

    function plot_line(data, color, width = 2, opacity = 1) {
        if (typeof(opacity) === 'undefined') {
            opacity = 1;
        }
        svg.append('path').attr('d', line(data)).attr('stroke', color).attr('stroke-width', width).attr('fill', "none").attr("opacity", opacity);
    }

    function plot_points(data, stroke = "black", color = "black", size = 3, opacity = 1, on_drag, dragging, end_drag) {
        if (typeof(opacity) === 'undefined') {
            opacity = 1;
        }
        for (var i = 0; i < data.length; i++) {
            svg.append("circle").attr("cx", x_scale(data[i].x)).attr("cy", y_scale(data[i].y)).attr("r", size).attr("stroke", stroke).attr("fill", color).attr("opacity", opacity).call(d3.drag().on("start", on_drag).on("drag", dragging).on("end", end_drag));
        }
    }

    function plot_contour(data, n, m, color_scale, contour_scale, id, opacity, stroke) {
        //contour is a marching square, we have to scale the squares to svg size
        if (id) {
            size_multiplier = width / n;
            svg.select(id).selectAll("path").data(contour_scale(data)).enter().append("path").attr("d", d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr("id", id).attr("fill", function(d) {
                return color_scale(d.value);
            }).attr("opacity", opacity).attr("stroke", stroke);

        } else {
            size_multiplier = width / n;
            svg.selectAll("path").data(contour_scale(data)).enter().append("path").attr("d", d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr("id", id).attr("fill", function(d) {
                return color_scale(d.value);
            }).attr("opacity", opacity);
        }
    }

    function add_group(name) {
        svg.append("g").attr("id", name);
    }

    return {plot_line: plot_line, plot_points: plot_points, plot_contour: plot_contour, add_group: add_group};
}
