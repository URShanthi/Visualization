var app = angular.module("myapp", ['ngGrid']);
	
	app.controller("parallelctrl", function($scope,$http,$rootScope, $filter) {
		var uploader = document.getElementById("uploader");  
		var reader = new FileReader();
		
		$scope.gridOptions = { 
		        data: 'test',
		        rowTemplate: '<div ng-mouseover="hoverIn(row)"  ng-mouseleave="hoverOut()" ng-style="{cursor: row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>',
		        selectedItems: $scope.mySelections,
		        enableRowSelection:true,
		     	multiSelect: false,
		     	showGroupPanel: true
		
		    };
		$scope.hoverIn = function(rowItem) {
			highlight(rowItem.entity);
	    };
	    
	    $scope.hoverOut = function() {
			unhighlight();
	    };
		reader.onload = function(e) {
		  var contents = e.target.result;
		  var data = d3.csv.parse(contents);
		  parallel_coordinates(data);

		};
		uploader.addEventListener("change", handleFiles, false);  

		function handleFiles() {
		  var file = this.files[0];
		  reader.readAsText(file);
		};

	var width = document.body.clientWidth,
	    height = d3.max([document.body.clientHeight-210, 390]);
	
	var m = [40, 0, 40, 0],
	    w = width - m[1] - m[3],
	    h = height - m[0] - m[2],
	    //for displaying Title down the charts
	    la_bot=h+m[2]-10,
		la_bot1=h+m[0]-25,
	    xscale = d3.scale.ordinal().rangePoints([75, w], 1),
	    yscale = {},
	    dragging = {},
	    line = d3.svg.line(),
	    axis = d3.svg.axis().orient("left").ticks(1+height/50),
	    data,
	    foreground,
	    background,
	    highlighted,
	    keys,
	    dimensions,                           
	    n_dimensions,
	    legend,
	    render_speed = 50,
	    brush_count = 0,
	    excluded_groups = [];
	var precolors= [[110,20,71],[28,100,53],[214,56,80],[0,0,33],[30,100,74],[360,59,50],[110,57,71],[120,57,40],[1,100,79],[271,39,57],[274,31,76],[10,30,42],[10,29,67],[318,66,68],[334,80,84],[0,0,50],[0,0,78]];
	var colors_val=[];
	var cid=[];
	var colors={};
	var uniquecolor=[];
	var tobe_color;
	var uniqueVal;
	var ordinalfields=[];
	var unqordinalfields=[];
	var datafieldmap={};
	var renamekeys=[];
	var hidecol=['Name'];
	
	function hasWhiteSpace(s) {
		return /\s/g.test(s);
	}
	
	Array.prototype.contains = function(elem)
	{
	   for (var i in this)
	   {
	       if (this[i] == elem) return true;
	   }
	   return false;
	}
	// Scale chart and canvas height
	d3.select("#chart")
	    .style("height", (h + m[0] + m[2]) + "px")
	
	 console.log("h value "+h+m[0]);
	    
	d3.selectAll("canvas")
	    .attr("width", w)
	    .attr("height", h)
	    .style("padding", m.join("px ") + "px");
	
	
	// Foreground canvas for primary view
	foreground = document.getElementById('foreground').getContext('2d');
	foreground.globalCompositeOperation = "destination-over";
	foreground.strokeStyle = "rgba(0,100,160,0.1)";
	foreground.lineWidth = 2;
	
	// Highlight canvas for temporary interactions
	highlighted = document.getElementById('highlight').getContext('2d');
	highlighted.strokeStyle = "rgba(176,23,31,1)";
	highlighted.lineWidth = 3;
	
	// Background canvas
	background = document.getElementById('background').getContext('2d');
	background.strokeStyle = "rgba(0,100,160,0.1)";
	background.lineWidth = 1.5;
	
	// SVG for ticks, labels, and interactions
	var svg = d3.select("svg")
	    .attr("width", w + m[1] + m[3])
	    .attr("height", h + m[0] + m[2])
	  .append("svg:g")
	    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

	// Load the data and visualization
	function parallel_coordinates(raw_data) {
	var dt=[];
	  data = raw_data.map(function(val,key) {
		  datafieldmap={};
		 for (var k in val) {
			 
			 if (!_.isNaN(raw_data[0][k] - 0)) {
				 if(hasWhiteSpace(k))
					{	
					 //console.log("s : ",k);
					 datafieldmap[k.replace( /\s/g, '_')] = parseFloat(val[k]) || 0;
					}
				 else{
					 //console.log("k1 val1 : "+k,val[k]);
					 datafieldmap[k] = parseFloat(val[k]) || 0;
				 }

	      }
	      else
	    	  {
	    	  //console.log("k val2 : "+k,val[k]);
	    	  if(hasWhiteSpace(k))
				{	
	    			 //console.log("s : ",k);
	    			 datafieldmap[k.replace( /\s/g, '_')] = val[k];
				     ordinalfields.push(k.replace( /\s/g, '_'));
				}
	    	  else
	    		  {
	    		  //console.log("s1 : ",k);
	    		  datafieldmap[k]=val[k];
	    	  	  ordinalfields.push(k);
	    		  }

	    	  }
			 console.log("val121 :  ",datafieldmap);
			 
	    }
	   console.log("val :  ",datafieldmap);
	   dt.push(datafieldmap);
	    return datafieldmap;
	  });
	  //console.log("Data :",dt);
	 unqordinalfields = ordinalfields.filter(function(elem, pos) {
		    return ordinalfields.indexOf(elem) == pos;	
		  });
	  keys = d3.keys(data[0]);
	  console.log("Key Values : ",keys);
	
	  for (var k=0;k<keys.length;k++)
		  {
		  	console.log("key",keys[k],"  > k val : ",k);
		  	
		  	if((keys[k])!="contains"){
		  		renamekeys.push(keys[k]);
		  		}
		  	renamekeys.join(",");
		  }
	  keys=renamekeys;
	  console.log("after replace of characteres ",keys);
	  tobe_color=keys[0];	
	 console.log(" unqordinalfields : "+unqordinalfields+" tobe_color : "+tobe_color+" Column to Hide: "+hidecol);
	  xscale.domain(dimensions = keys.filter(function(k) {
		  if(k!="contains"){
		  if(unqordinalfields.contains(k))
			  {
			  console.log(unqordinalfields);
			   if(hidecol.contains(k))
				  {
				   d3.scale.ordinal()
			          .domain(data.map(function(p) {if(k==tobe_color) cid.push(p[k]);return p[k]; }));
					  return false;
				  }
			   else
				   {
				   yscale[k] = d3.scale.ordinal()
		          .domain(data.map(function(p) {
		        	  if(k==tobe_color){ 
		        		  cid.push(p[k]);
		        		  console.log(p[k]);
		        	  	}
		        	  return p[k]; 
		        	  }))
		          .rangePoints([h, 0]);
				   //console.log(k +" :  "+yscale[k]);
				   }
			  }
	     else {
		    	yscale[k] = d3.scale.linear()
		          .domain(d3.extent(data, function(p) {if(k==tobe_color){ console.log("tobe_color : "+tobe_color); cid.push(p[k]);} return +p[k]; }))
		          .range([h, 0]);
		    }
		  return true;
		  }
		  }));
	  console.log("CID : ",cid);
	  uniqueVal = cid.filter(function(elem, pos) {
		    return cid.indexOf(elem) == pos;	
		  });
	  console.log(uniqueVal);
		 var l=0;
		 angular.forEach(uniqueVal,function(entry) {
		 console.log(entry);
		 if(precolors[l]==undefined)
			 {
			 l=0;
			 }
		 colors[entry]=precolors[l];
		 l++;
			});
	 n_dimensions = dimensions.length;
	 console.log("Length : "+n_dimensions+" dimensions : "+dimensions);
	  // Add a group element for each dimension.
	  var g = svg.selectAll(".dimension")
	      .data(dimensions)
	    .enter().append("svg:g")
	      .attr("class", "dimension")
	      .attr("transform", function(d) {console.log("d val : "+d+" xscals : "+xscale(d)); return "translate(" + xscale(d) + ")"; })
	      .call(d3.behavior.drag()
	        .on("dragstart", function(d) {
	          dragging[d] = this.__origin__ = xscale(d);
	          this.__dragged__ = false;
	          d3.select("#foreground").style("opacity", "0.35");
	        })
	        .on("drag", function(d) {
	          dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
	          dimensions.sort(function(a, b) { return position(a) - position(b); });
	          xscale.domain(dimensions);
	          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
	          brush_count++;
	          this.__dragged__ = true;
	
	          // Feedback for axis deletion if dropped
	          if (dragging[d] == 0) {
	            d3.select(this).select(".background").style("fill", "#b00");
	          } else {
	            d3.select(this).select(".background").style("fill", null);
	          }
	        })
	        .on("dragend", function(d) {
	          if (!this.__dragged__) {
	            // no movement, invert axis
	            var extent = invert_axis(d);
	            // TODO refactor extents and update_ticks to avoid resetting extents manually
	            update_ticks(d, extent);
	          } else {
	            // reorder axes
	            d3.select(this).transition().attr("transform", "translate(" + xscale(d) + ")");
	          }
	
	          // remove axis if dragged all the way left
	          if (dragging[d] == 0) {
	            remove_axis(d,g);
	          }
	
	          // rerender
	          d3.select("#foreground").style("opacity", null);
	          brush();
	          delete this.__dragged__;
	          delete this.__origin__;
	          delete dragging[d];
	        }))
	
	  // Add and store a brush for each axis.
	  g.append("svg:g")
	      .attr("class", "brush")
	      .each(function(d) {
	    	  console.log("--",d);
	    	  d3.select(this).call(yscale[d].brush = d3.svg.brush().y(yscale[d]).on("brush", brush)); 
	    	  })
	    .selectAll("rect")
	      .style("visibility", null)
	      .attr("x", -23)
	      .attr("width", 36)
	      .attr("rx", 0)
	      .attr("ry", 0)
	      .append("title")
	        .text("Drag up or down to brush along this axis");
	
	  g.selectAll(".extent")
	      .append("title")
	        .text("Drag or resize this filter");
	
	  // Add an axis and title.
	  g.append("svg:g")
	      .attr("class", "axis")
	      .attr("transform", "translate(0,0)")
	      .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); })
	    .append("svg:text")
	      .attr("text-anchor", "middle")
	      .attr("y", function(d,i) { return i%2 == 0 ? -14:-30 })
	      .attr("x", 0)
	      .attr("class", "label")
	      .text(String)
	      .append("title")
	        .text("Click to invert. Drag to reorder");
	
	   legend = create_legend(colors,brush);
	
	  // Render full foreground
	  brush();
	
	};
	
	// copy one canvas to another, grayscale
	function gray_copy(source, target) {
	  var pixels = source.getImageData(0,0,w,h);
	  target.putImageData(grayscale(pixels),0,0);
	}
	
	// http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
	function grayscale(pixels, args) {
	  var d = pixels.data;
	  for (var i=0; i<d.length; i+=4) {
	    var r = d[i];
	    var g = d[i+1];
	    var b = d[i+2];
	    // CIE luminance for the RGB
	    // The human eye is bad at seeing red and blue, so we de-emphasize them.
	    var v = 0.2126*r + 0.7152*g + 0.0722*b;
	    d[i] = d[i+1] = d[i+2] = v
	  }
	  return pixels;
	};
	
	
	function create_legend(colors,brush) {
	  // create legend
	  var legend_data = d3.select("#legend")
	    .html("")
	    .selectAll(".row")
	    .data( _.keys(colors).sort() )
	
	  // filter by group
	  var legend = legend_data
	    .enter().append("div")
	      .attr("title", "Hide group")
	      .on("click", function(d) { 
	        // toggle food group
	        if (_.contains(excluded_groups, d)) {
	          d3.select(this).attr("title", "Hide group")
	          excluded_groups = _.difference(excluded_groups,[d]);
	          brush();
	        } else {
	          d3.select(this).attr("title", "Show group")
	          excluded_groups.push(d);
	          brush();
	        }
	      });
	
	  legend
	    .append("span")
	    .style("background", function(d,i) { return color(d,0.85)})
	    .attr("class", "color-bar");
	
	  legend
	    .append("span")
	    .attr("class", "tally")
	    .text(function(d,i) { return 0});  
	
	  legend
	    .append("span")
	    .text(function(d,i) { return " " + d});  
	
	  return legend;
	}
	
	 
	// render polylines i to i+render_speed 
	function render_range(selection, i, max, opacity) {
		var j=0;
		var k=null;
		
		angular.forEach(selection.slice(i,max),function(d) {
		  var o = {};  
		  for(key in d){
				  o[key]=d[key];
			  break;
		  }
		  for(k in o){
			  path(d, foreground, color(o[k],opacity));
		  }
		  j++;
	  });
	};
		
	// simple data table	
	$scope.data_table = function(sample) { 
		
		$scope.test=[];
		$scope.sample = sample.sort(function(a,b) {
			var col=keys;
		    return a[col] < b[col] ? -1 : 1;
		  });
		console.log("Len : ",$scope.sample.length);
		for (var key=0;key<$scope.sample.length;key++)
			{
			if(key!="contains")
				{
			var tmp=[];
			for (j in $scope.sample[key])
				{
				if(hasWhiteSpace(j))
		  			{	
				  		console.log(j.replace( /\s/g, '_'));
				  		//j=j.replace( /\s/g, '_');
				  		tmp[j.replace( /\s/g, '_')]=$scope.sample[key][j];
		  			}
				else
					tmp[j]=$scope.sample[key][j];
				}
			$scope.test.push(tmp);
			$scope.test.join(",");
				}
			}
		
		console.log("test ",$scope.test);
		$scope.$apply();
		
}
	
	// Adjusts rendering speed 
	function optimize(timer) {
	  var delta = (new Date()).getTime() - timer;
	  render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 8);
	  render_speed = Math.min(render_speed, 300);
	  return (new Date()).getTime();
	}
	
	// Feedback on rendering progress
	function render_stats(i,n,render_speed) {
	  d3.select("#rendered-count").text(i);
	  d3.select("#rendered-bar")
	    .style("width", (100*i/n) + "%");
	  d3.select("#render-speed").text(render_speed);
	}
	
	// Feedback on selection
	function selection_stats(opacity, n, total) {
	  d3.select("#data-count").text(total);
	  d3.select("#selected-count").text(n);
	  d3.select("#selected-bar").style("width", (100*n/total) + "%");
	  d3.select("#opacity").text((""+(opacity*100)).slice(0,4) + "%");
	}
	
	// Highlight single polyline
	function highlight(d) {
		//console.log("d : ",d);
	  d3.select("#foreground").style("opacity", "0.35");
	  d3.selectAll(".row").style("opacity", function(p) { return (d == p) ? null : "0.3" });
	  d3.selectAll(".row").append("title", function(p) { return p});
	  path(d, highlighted, color(uniqueVal[4],1));
	}
	
	// Remove highlight
	function unhighlight() {
	  d3.select("#foreground").style("opacity", null);
	  d3.selectAll(".row").style("opacity", null);
	  highlighted.clearRect(0,0,w,h);
	}
	
	function invert_axis(d) {
	  // save extent before inverting
	  if (!yscale[d].brush.empty()) {
	    var extent = yscale[d].brush.extent();
	  }
	  if (yscale[d].inverted == true) {
	    yscale[d].range([h, 0]);
	    d3.selectAll('.label')
	      .filter(function(p) { return p == d; })
	      .style("text-decoration", null);
	    yscale[d].inverted = false;
	  } else {
	    yscale[d].range([0, h]);
	    d3.selectAll('.label')
	      .filter(function(p) { return p == d; })
	      .style("text-decoration", "underline");
	    yscale[d].inverted = true;
	  }
	  return extent;
	}
	
	// Draw a single polyline
	function path(d, ctx, color) {
	  if (color) ctx.strokeStyle = color;
	  var x = xscale(0)-15;
	      y = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
	  ctx.beginPath();
	  ctx.moveTo(x,y);
	  dimensions.map(function(p,i) {
		  x = xscale(p),
		    y = yscale[p](d[p]);
		   // ctx.lineTo(x, y);
		    if (i == 0) {
		        ctx.moveTo(x,y);
		      } else { 
		        var cp1x = x - 0.85*(x-x0);
		        var cp1y = y0;
		        var cp2x = x - 0.15*(x-x0);
		        var cp2y = y;
		        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
		      }
		      x0 = x;
		      y0 = y;
	  });
	  ctx.lineTo(x+15, y);                               // right edge
	  ctx.stroke();
	}

	function color(d,a) {
	  var c = colors[d];
	  //console.log(c);
	  if(c!=undefined)
	  return ["hsla(",c[0],",",c[1],"%,",c[2],"%,",a,")"].join("");
	}
	
	function position(d) {
	  var v = dragging[d];
	  return v == null ? xscale(d) : v;
	}
	
	// Handles a brush event, toggling the display of foreground lines.
	// TODO refactor
	function brush() {
	  brush_count++;
	  //console.log(yscale);
	  var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
	      extents = actives.map(function(p) {
  	      return yscale[p].brush.extent(); });
	    	
	  // bold dimensions with label
	  d3.selectAll('.label')
	    .style("font-weight", function(dimension) {
	      if (_.include(actives, dimension)) return "bold";
	      return null;
	    });
	
	  // Get lines within extents
	  var selected = [];
	  data
	    .filter(function(d) {
	    	//console.log("exc : "+excluded_groups);
	      return !_.contains(excluded_groups, d.tobe_color);
	    })
	    .map(function(d) {
	      return actives.every(function(p, dimension) {
	    	  //console.log(extents[dimension][0] + " @ " + d[p]);
	    	  var p_new = (yscale[p].ticks)?d[p]:yscale[p](d[p]); 
	        return extents[dimension][0] <= p_new && p_new <= extents[dimension][1];
	      }) ? selected.push(d) : null;
	    });
	
	  if (selected.length < data.length && selected.length > 0) {
	    d3.select("#keep-data").attr("disabled", null);
	    d3.select("#exclude-data").attr("disabled", null);
	  } else {
	    d3.select("#keep-data").attr("disabled", "disabled");
	    d3.select("#exclude-data").attr("disabled", "disabled");
	  };
	
	  
	  // total by food group
	  var tallies = _(selected)
	    .groupBy(function(d) { return d.tobe_color; })
	
	  // include empty groups
	  _(colors).each(function(v,k) { tallies[k] = tallies[k] || []; });
	
	  legend
	    .style("text-decoration", function(d) { return _.contains(excluded_groups,d) ? "line-through" : null; })
	    .attr("class", function(d) {
	      return (tallies[d].length > 0)
	           ? "row"
	           : "row off";
	    });
	
	  legend.selectAll(".color-bar")
	    .style("width", function(d) {
	      return Math.ceil(600*tallies[d].length/data.length) + "px"
	    });
	
	  legend.selectAll(".tally")
	    .text(function(d,i) { return tallies[d].length });  
	  
	
	  // Render selected lines
	  paths(selected, foreground, brush_count, true);
	}
	
	// render a set of polylines on a canvas
	function paths(selected, ctx, count) {
	  var n = selected.length,
	      i = 0,
	      opacity = d3.min([3/Math.pow(n,0.4),1]),
	      timer = (new Date()).getTime();
	
	  selection_stats(opacity, n, data.length);
	
	  shuffled_data = _.shuffle(selected);
	  //console.log(shuffled_data);
	  $scope.data_table(shuffled_data);
	
	  ctx.clearRect(0,0,w+1,h+1);
	
	  // render all lines until finished or a new brush event
	  function animloop(){
	    if (i >= n || count < brush_count) return true;
	    var max = d3.min([i+render_speed, n]);
	    render_range(shuffled_data, i, max, opacity);
	    render_stats(max,n,render_speed);
	    i = max;
	    timer = optimize(timer);  // adjusts render_speed
	  };
	
	  d3.timer(animloop);
	}
	
	// transition ticks for reordering, rescaling and inverting
	function update_ticks(d, extent) {
	  // update brushes
	  if (d) {
	    var brush_el = d3.selectAll(".brush")
	        .filter(function(key) { return key == d; });
	    // single tick
	    if (extent) {
	      // restore previous extent
	      brush_el.call(yscale[d].brush = d3.svg.brush().y(yscale[d]).extent(extent).on("brush", brush));
	    } else {
	      brush_el.call(yscale[d].brush = d3.svg.brush().y(yscale[d]).on("brush", brush));
	    }
	  } else {
	    // all ticks
	    d3.selectAll(".brush")
	      .each(function(d) { d3.select(this).call(yscale[d].brush = d3.svg.brush().y(yscale[d]).on("brush", brush)); })
	  }
	
	  brush_count++;
	
	  show_ticks();
	
	  // update axes
	  d3.selectAll(".axis")
	    .each(function(d,i) {
	      // hide lines for better performance
	      d3.select(this).selectAll('line').style("display", "none");
	
	      // transition axis numbers
	      d3.select(this)
	        .transition()
	        .duration(720)
	        .call(axis.scale(yscale[d]));
	
	      // bring lines back
	      d3.select(this).selectAll('line').transition().delay(800).style("display", null);
	
	      d3.select(this)
	        .selectAll('text')
	        .style('font-weight', null)
	        .style('font-size', null)
	        .style('display', null);
	    });
	}
	
	// Rescale to new dataset domain
	function rescale() {
	  // reset yscales, preserving inverted state
		angular.forEach(dimensions,function(d,i) {
	    if (yscale[d].inverted) {
	      yscale[d] = d3.scale.linear()
	          .domain(d3.extent(data, function(p) { return +p[d]; }))
	          .range([0, h]);
	      yscale[d].inverted = true;
	    } else {
	      yscale[d] = d3.scale.linear()
	          .domain(d3.extent(data, function(p) { return +p[d]; }))
	          .range([h, 0]);
	    }
	  });
	
	  update_ticks();
	
	  // Render selected data
	  paths(data, foreground, brush_count);
	}
	
	// Get polylines within extents
	function actives() {
	  var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
	      extents = actives.map(function(p) { 
	    	  	  return yscale[p].brush.extent(); });
	
	  var selected = [];
	  data
	    .filter(function(d) {
	      return !_.contains(excluded_groups, d.tobe_color);
	    })
	    .map(function(d) {
	    return actives.every(function(p, i) {
	    	var p_new = (yscale[p].ticks)?d[p]:yscale[p](d[p]); 
	      return extents[i][0] <= p_new && p_new <= extents[i][1];
	    }) ? selected.push(d) : null;
	  });
	
	  return selected;
	}
	
	// scale to window size
	window.onresize = function() {
	  width = document.body.clientWidth,
	  height = d3.max([document.body.clientHeight-250, 220]);
	
	  w = width - m[1] - m[3],
	  h = height - m[0] - m[2];
	
	  d3.select("#chart")
	      .style("height", (h + m[0] + m[2]) + "px")
	
	  d3.selectAll("canvas")
	      .attr("width", w)
	      .attr("height", h)
	      .style("padding", m.join("px ") + "px");
	
	  d3.select("svg")
	      .attr("width", w + m[1] + m[3])
	      .attr("height", h + m[0] + m[2])
	    .select("g")
	      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
	  
	  xscale = d3.scale.ordinal().rangePoints([0, w], 1).domain(dimensions);
	  angular.forEach(dimensions,function(d) {
	    //yscale[d].range([h, 0]);
		  console.log("onresize ",d);
		  if(unqordinalfields.contains(d))
		  {
		  yscale[d].rangePoints([h, 0]);
		  }
	  else
		  {
		  yscale[d].range([h, 0]);
		  }
	  });
	
	  d3.selectAll(".dimension")
	    .attr("transform", function(d) { return "translate(" + xscale(d) + ")"; })
	  // update brush placement
	  d3.selectAll(".brush")
	    .each(function(d) { 
	    	d3.select(this).call(yscale[d].brush = d3.svg.brush().y(yscale[d]).on("brush", brush)); })
	  brush_count++;
	
	  // update axis placement
	  axis = axis.ticks(1+height/50),
	  d3.selectAll(".axis")
	    .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); });
	
	  // render data
	  brush();
	};
	
	// Remove all but selected from the dataset
	function keep_data() {
	  new_data = actives();
	  if (new_data.length == 0) {
	    alert("I don't mean to be rude, but I can't let you remove all the data.\n\nTry removing some brushes to get your data back. Then click 'Keep' when you've selected data you want to look closer at.");
	    return false;
	  }
	  data = new_data;
	  rescale();
	}
	
	// Exclude selected from the dataset
	function exclude_data() {
	  new_data = _.difference(data, actives());
	  if (new_data.length == 0) {
	    alert("I don't mean to be rude, but I can't let you remove all the data.\n\nTry selecting just a few data points then clicking 'Exclude'.");
	    return false;
	  }
	  data = new_data;
	  rescale();
	}
	
	function remove_axis(d,g) {
	  dimensions = _.difference(dimensions, [d]);
	  xscale.domain(dimensions);
	  g.attr("transform", function(p) { return "translate(" + position(p) + ")"; });
	  g.filter(function(p) { return p == d; }).remove(); 
	  update_ticks();
	}
	
	d3.select("#keep-data").on("click", keep_data);
	d3.select("#exclude-data").on("click", exclude_data);
	//d3.select("#export-data").on("click", export_csv);
	
	
	// Appearance toggles
	d3.select("#hide-ticks").on("click", hide_ticks);
	d3.select("#show-ticks").on("click", show_ticks);
	d3.select("#dark-theme").on("click", dark_theme);
	d3.select("#light-theme").on("click", light_theme);
	
	function hide_ticks() {
	  d3.selectAll(".axis g").style("display", "none");
	  d3.selectAll(".axis path").style("display", "none");
	  d3.selectAll(".background").style("visibility", "hidden");
	  d3.selectAll("#hide-ticks").attr("disabled", "disabled");
	  d3.selectAll("#show-ticks").attr("disabled", null);
	};
	
	function show_ticks() {
	  d3.selectAll(".axis g").style("display", null);
	  d3.selectAll(".axis path").style("display", null);
	  d3.selectAll(".background").style("visibility", null);
	  d3.selectAll("#show-ticks").attr("disabled", "disabled");
	  d3.selectAll("#hide-ticks").attr("disabled", null);
	};
	
	var dark_theme=function () {
	  d3.select("body").attr("class", "dark");
	  d3.selectAll("#dark-theme").attr("disabled", "disabled");
	  d3.selectAll("#light-theme").attr("disabled", null);
	}
	
	function light_theme() {
	  d3.select("body").attr("class", null);
	  d3.selectAll("#light-theme").attr("disabled", "disabled");
	  d3.selectAll("#dark-theme").attr("disabled", null);
	}
	
	
	
	});
