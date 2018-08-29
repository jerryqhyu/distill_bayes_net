var param = {
    w: 520,
    h: 300,
    w_progress: 650,
    h_progress: 300,
    n: 40,
    m: 40,
    n_cc: 14,
    m_cc: 14,
    step_size: 0.1,
    learning_rate: 5e-3,
    l1_decay: 0,
    l2_decay: 10.0,
    momentum: 0.95,
    divergence_curve_domain_x: [
        -12, 12
    ],
    divergence_curve_domain_y: [
        -0.15, 0.5
    ],
    classification_domain_x:[-2,2],
    classification_domain_y:[-1,1],
    classification_loss_domain_x: [
        -40, 60
    ],
    classification_loss_domain_y: [
        -60, 40
    ],
    curve_domain_x: [
        -5, 5
    ],
    curve_domain_x_extended: [
        -10, 10
    ],
    hero_domain_y: [
        -2, 2
    ],
    curve_domain_y: [
        -2, 2
    ],
    loss_domain_x: [
        -2.5, 2.5
    ],
    loss_domain_y: [
        -2.5, 2.5
    ],
    nn_domain: [
        0, 1
    ],
    progress_domain_x: [
        0, 1
    ],
    progress_domain_y: [
        0, 8
    ],
    train_points: [
        0.98348382,
        0.33239784,
        1.31901198,
        -1.33424016,
        -2.49962207,
        2.671385
    ],
    train_noise: [
        -0.24911933,
        -0.18541917,
        0.37738159,
        0.16834003,
        0.39383113,
        0.37258389
    ],
    validation_points: [
        0.0074539,
        -2.25649362,
        1.2912101,
        -1.15521679,
        0.15278725,
        2.0997623,
        1.47247248,
        -1.05303993,
        0.4568989,
        -0.61385536,
        -2.18751186,
        1.26085173,
        -2.8500024,
        2.59464658,
        2.64281159,
        -2.93701525,
        0.7578316,
        2.49371189,
        2.43455803,
        -1.30204828,
        -0.72566079,
        -2.53146956,
        2.37625046,
        -1.46966588,
        -1.83330212,
        2.57031247,
        -1.91009532,
        -2.41233259,
        -0.44398402,
        1.06769911,
        2.32972244,
        -1.84966642,
        2.53616255,
        0.42077324,
        0.4261107,
        1.42198161,
        2.72728906,
        -1.71100897,
        -1.59204741,
        1.2299973,
        0.37747723,
        0.32106662,
        0.07131672,
        0.03220256,
        -1.37330352,
        1.47470907,
        2.19194335,
        -0.77412576,
        -1.29907828,
        -2.64114398
    ],
    validation_noise: [
        -0.09674867,
        0.02199221,
        0.14537768,
        -0.11992788,
        0.09587188,
        0.04348861,
        0.26443214,
        -0.04382649,
        -0.02890301,
        -0.00131674,
        0.09219836,
        0.05413551,
        0.10605215,
        0.03032372,
        0.04228423,
        0.07250382,
        0.01140705,
        -0.01311484,
        0.04177916,
        -0.10178443,
        -0.21569761,
        0.01565909,
        -0.27418905,
        -0.03551064,
        0.02892201,
        0.05344915,
        -0.05026234,
        0.18413039,
        -0.11663553,
        0.0162466,
        -0.16556253,
        -0.04830382,
        0.24141434,
        0.09317031,
        0.00835115,
        0.11408831,
        0.10949991,
        -0.03641678,
        -0.14478094,
        0.0234874,
        -0.07348802,
        0.14804239,
        -0.23464277,
        0.01217727,
        0.00439172,
        -0.20313738,
        0.09017244,
        0.08452561,
        0.0044375,
        0.09312328
    ],
    opt_layer1_w: [
        [-0.3, -0.3]
    ],
    opt_layer1_b: [
        -1.471708721550612, 1.4638299054171822
    ],
    opt_layer3_w: [
        [
            -3.4756037730352953, -3.1951265117983656
        ],
        [
            -0.6023875694498428, 0.742082606972636
        ],
        [
            3.2691245346279794, 2.639303322222997
        ],
        [
            0.6001228460411082, 1.5988685131936045
        ]
    ],
    opt_layer3_b: [
        -0.4959376942683454, -0.38383011398703676, 0.1385379213238358, 0.14474274177948032
    ],
    opt_layer5_w: [
        [
            -0.7608457857739974, -3.807077771966103, 0.15964555671290204, 0.4316940153554302
        ],
        [
            -0.46029527392239034, 0.499362627227224, 0.26215741516903984, 0.6087584334472715
        ],
        [
            -0.12003663770954856, -2.070047029632726, -0.8253090796194713, -0.5211260899153192
        ],
        [
            1.1497913505525421, 3.1232664390054965, 0.31466460121428946, -1.1103448335850838
        ]
    ],
    opt_layer5_b: [
        -0.09954752198229085, -0.20782723076897178, 1.0460388498407667, -0.6316497703555812
    ],
    opt_layer7_w: [
        [
            0.16424348634195116, -0.6067898480353261, -1.0202767210893393, -0.7873295687436086
        ]
    ],
    opt_layer7_b: [0.1996533593619645],
    layer1w: [
        [-0.2, -0.2]
    ],
    layer1b: [
        -1.471708721550612, 1.4638299054171822
    ],
    layer2w: [
        [-3.4756037730352953, -0.6023875694498428, 3.2691245346279794, 0.6001228460411082],
        [-3.1951265117983656, 0.742082606972636, 2.639303322222997, 1.5988685131936045],
    ],
    layer2b: [
        -0.4959376942683454, -0.38383011398703676, 0.1385379213238358, 0.14474274177948032
    ],
    layer3w: [
        [-0.7608457857739974, -0.46029527392239034, -0.12003663770954856, 1.1497913505525421],
        [-3.807077771966103, 0.499362627227224, -2.070047029632726, 3.1232664390054965],
        [0.15964555671290204, 0.26215741516903984, -0.8253090796194713, 0.31466460121428946],
        [0.4316940153554302, 0.6087584334472715, -0.5211260899153192, -1.1103448335850838],
    ],
    layer3b: [
        -0.09954752198229085, -0.20782723076897178, 1.0460388498407667, -0.6316497703555812
    ],
    layer4w: [
        [0.16424348634195116],
        [-0.6067898480353261],
        [-1.0202767210893393],
        [-0.7873295687436086],
    ],
    layer4b: [
        0.1996533593619645
    ],
};

var train_xs = [
    [0.98348382],
    [0.33239784],
    [1.31901198],
    [-1.33424016],
    [-2.49962207],
    [2.671385]
];

var train_ys = [
    [0.58331356],
    [0.14089138],
    [1.34585101],
    [-0.80381079],
    [-0.20494374],
    [0.82565530]
];

var experiment_xs = [
    [0.98348382],
    [0.33239784],
    [0.6239784],
    [-1.91901198],
    [-1.33424016],
    [-0.51812853],
    [-0.01824016],
];

var experiment_ys = [
    [0.58331356],
    [0.14089138],
    [0.58426848783],
    [-0.95818255],
    [-0.80381079],
    [-0.485124009],
    [-0.01681914858],
];

// var experiment_xs = [
//     [0.98348382],
//     [0.33239784],
//     [0.6239784],
//     [-1.91901198],
//     [-1.33424016],
//     [-0.51812853],
//     [-0.01824016],
// ];

// var experiment_ys = [
//     [0.58331356],
//     [0.14089138],
//     [0.58426848783],
//     [-0.95818255],
//     [-0.80381079],
//     [-0.485124009],
//     [-0.01681914858],
// ];

var valid_xs = [
    [0.0074539],
    [-2.25649362],
    [1.2912101],
    [-1.15521679],
    [0.15278725],
    [2.0997623],
    [1.47247248],
    [-1.05303993],
    [0.4568989],
    [-0.61385536],
    [-2.18751186],
    [1.26085173],
    [-2.8500024],
    [2.59464658],
    [2.64281159],
    [-2.93701525],
    [0.7578316],
    [2.49371189],
    [2.43455803],
    [-1.30204828],
    [-0.72566079],
    [-2.53146956],
    [2.37625046],
    [-1.46966588],
    [-1.83330212],
    [2.57031247],
    [-1.91009532],
    [-2.41233259],
    [-0.44398402],
    [1.06769911],
    [2.32972244],
    [-1.84966642],
    [2.53616255],
    [0.42077324],
    [0.4261107],
    [1.42198161],
    [2.72728906],
    [-1.71100897],
    [-1.59204741],
    [1.2299973],
    [0.37747723],
    [0.32106662],
    [0.07131672],
    [0.03220256],
    [-1.37330352],
    [1.47470907],
    [2.19194335],
    [-0.77412576],
    [-1.29907828],
    [-2.64114398]
];

var valid_ys = [
    [-0.089294839023698946], 
    [-0.75198549026754558], 
    [1.1065473845996467], 
    [-1.0348103834309166], 
    [0.24806538061787947], 
    [0.90681795418058586], 
    [1.2596022435743763], 
    [-0.91275828641839563], 
    [0.41226421833615412], 
    [-0.5773399729655927], 
    [-0.7235840939794187], 
    [1.006485979650307], 
    [-0.18142356365234624], 
    [0.55040496841379749], 
    [0.5206396953648309], 
    [-0.1306495740823638], 
    [0.69875514229715707], 
    [0.59038311823253409], 
    [0.69136123996580134], 
    [-1.0658885062549153], 
    [-0.87932750878353683], 
    [-0.55730925917705687], 
    [0.41859476043027583], 
    [-1.0304013131733936], 
    [-0.93682074412901373], 
    [0.59415854405887658], 
    [-0.99325055058702671], 
    [-0.48218768082424435],
    [-0.54617615391224361],
    [0.89234007022180817], 
    [0.56001288628902401], 
    [-1.0096709008848859], 
    [0.81053012474540642], 
    [0.50163667798141942], 
    [0.42168356792539718], 
    [1.1030358198428698], 
    [0.51205244979555908], 
    [-1.0266030809303488], 
    [-1.1445551442291049], 
    [0.96597529948639893], 
    [0.29508846427872526], 
    [0.46362124496802859], 
    [-0.16338648832071101], 
    [0.04437426458664849], 
    [-0.97616987935927957], 
    [0.79224979027598064], 
    [0.90338390060204121], 
    [-0.61456562258641656], 
    [-0.95887371712782976], 
    [-0.38669595845328064]
];
// scales
var divergence_fill_color = d3.scaleLinear().domain([-50, 0]).interpolate(function() {
    return d3.interpolateRdYlGn;
});

var train_contour_color = d3.scaleLinear().domain([-1, 0.02]).interpolate(function() {
    return d3.interpolateSpectral;
});

var train_contour_scale = d3.contours().size([param.n, param.m]).thresholds(d3.range(-0.02, 1, 0.02));

var valid_contour_color = d3.scaleLinear().domain([-0.8, 0.02]).interpolate(function() {
    return d3.interpolateSpectral;
});
var valid_contour_scale = d3.contours().size([param.n, param.m]).thresholds(d3.range(-0.02, 0.8, 0.02));

var train_contour_scale_cc = d3.contours().size([param.n_cc, param.m_cc]).thresholds(d3.range(-0.02, 1, 0.1));
var valid_contour_scale_cc = d3.contours().size([param.n_cc, param.m_cc]).thresholds(d3.range(-0.02, 0.8, 0.1));

var classification_contour_scale_cc = d3.contours().size([100, 100]).thresholds(d3.range(0, 3, 0.1));
var classification_contour_color = d3.scaleLinear().domain([-2.5, -0.5]).interpolate(function() {
    return d3.interpolateSpectral;
});
var classification_contour_loss_scale = d3.contours().size([param.n, param.m]).thresholds(d3.range(0, 0.5, 0.01));
var classification_contour_loss_color = d3.scaleLinear().domain([-0.5, -0]).interpolate(function() {
    return d3.interpolateSpectral;
});