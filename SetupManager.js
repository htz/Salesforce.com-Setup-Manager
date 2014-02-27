function require(option) {
	var script  = '<' + 'script type="' + (option.type || 'text/javascript') + '" src="' + option.src + '"';
	if (option.id) script += ' id="' + option.id + '"';
	script += '></' + 'script>';
	document.write(script);
}

require({src: 'https://rawgithub.com/BorisMoore/jquery-tmpl/master/jquery.tmpl.min.js'});
require({src: 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js'});
require({src: 'https://rawgithub.com/htz/Salesforce.com-Setup-Manager/master/jquery.cookie.js'});
require({src: 'https://rawgithub.com/htz/Salesforce.com-Setup-Manager/master/jquery.json.min.js'});

(function($) {
	$(function() {
		var setupData;
		$('#SetupManager').parent().siblings('div:first').remove();

		function writeSetupTab(data, clear) {
			setupData = data;
			$(data).each(function() {
				var d = setWindowOrder(this, clear);
				$('#SetupManager #setuptab ul li.action').before($('#tabTemplate').tmpl(d));
				$('#SetupManager').append($('#tabBodyTemplate').tmpl(d));
			});
			$(document).ready(function () {
				/* tab click event */
				$('#SetupManager #setuptab li.tab').click(function() {
					var id = $(this).attr('id');
					$('#SetupManager .bPageBlock').hide();
					$('#SetupManager .bPageBlock#' + id).show();
					$('#SetupManager #setuptab li.active').removeClass('active');
					$(this).addClass('active');
					$.cookie('setupmanager-currenttab', id);
				});
				/* sotable */
				$('#SetupManager .bPageBlock .droparea')
				.sortable({
					connectWith: 'ul',
					cancel: '.body,.action,:input,button',
					opacity: 0.5,
					revert: true,
				}).disableSelection()
				.bind('sortstop', function(e) {writeCookie($(this).parent());});
				/* min/max */
				$('#SetupManager h2').dblclick(function() {
					$(this).siblings('.body').toggle('fast');
					$(this).find('img').toggle();
					writeCookie($(this).parents('.bPageBlock:first'));
				});
				$('#SetupManager .action .minimize').click(function() {
					$(this).parent().parent().siblings('.body').hide('fast');
					$(this).hide().siblings('.maximize').show();
					writeCookie($(this).parents('.bPageBlock:first'));
				});
				$('#SetupManager .action .maximize').click(function() {
					$(this).parent().parent().siblings('.body').show('fast');
					$(this).hide().siblings('.minimize').show();
					writeCookie($(this).parents('.bPageBlock:first'));
				});
				/* setup plus/minus */
				$('#SetupManager .setupImage').bind('click', function() {
					$(this).toggleClass('setupPlus');
					$(this).toggleClass('setupMinus');
					$(this).siblings('ul').toggle('fast');
				});
				/* reset */
				$('#SetupManager #setuptab ul li.action .reset').click(function() {
					clearCookie();
					$('#SetupManager #setuptab li.tab').remove();
					$('#SetupManager .bPageBlock').remove();
					writeSetupTab(setupData, true);
				});
			});
			var firsttab = $.cookie('setupmanager-currenttab');
			if (firsttab) $('#SetupManager #setuptab ul li#' + firsttab).trigger('click');
			else $('#SetupManager #setuptab ul li:first').trigger('click');
			$('#SetupManager').show();
		}

		function setWindowOrder(d, clear) {
			var cstr = $.cookie('setupmanager-' + d.id);
			if (cstr && !clear) {
				var windows = {};
				$(d.child).map(function() {windows[this.id] = this;});
				var order = $.evalJSON(cstr);
				d.child1 = $(order[0]).map(function() {
					var w = windows[this.id];
					w.status = this.status;
					return w;
				}).toArray();
				d.child2 = $(order[1]).map(function() {
					var w = windows[this.id];
					w.status = this.status;
					return w;
				}).toArray();
				d.child3 = $(order[2]).map(function() {
					var w = windows[this.id];
					w.status = this.status;
					return w;
				}).toArray();
			} else {
				d.child1 = $(d.child).filter(function(i) {return i % 3 == 0}).toArray();
				d.child2 = $(d.child).filter(function(i) {return i % 3 == 1}).toArray();
				d.child3 = $(d.child).filter(function(i) {return i % 3 == 2}).toArray();
			}
			return d;
		}

		function clearCookie() {
			$('#SetupManager #setuptab li.tab').each(function() {
				var id = $(this).attr('id');
				$.cookie('setupmanager-' + id, '', {expires: -1});
			});
			$.cookie('setupmanager-currenttab', id, {expires: -1});
		}

		function writeCookie(trgetTab) {
			var id = trgetTab.attr('id');
			var toStatus = function() {
				return {
					id: this,
					status: !trgetTab.find('#' + this + ' .body').is(":hidden")
				};
			};
			var order = [
				$(trgetTab.find('.droparea1').sortable('toArray')).map(toStatus).toArray(),
				$(trgetTab.find('.droparea2').sortable('toArray')).map(toStatus).toArray(),
				$(trgetTab.find('.droparea3').sortable('toArray')).map(toStatus).toArray()
			];
			$.cookie('setupmanager-' + id, $.toJSON(order), {expires: 365});
		}

		/* run only /home/home.jsp */
		if (document.URL.match(/https\:\/\/(?:[^\/]+)\.salesforce\.com\/home\/home\.jsp(?:[\?#].*)?/)) {
			$.ajax({
				type: 'GET',
				url: '/setup/forcecomHomepage.apexp',
				success: function (data, status, xhr) {
					var divs = $(data).find('#AutoNumber5 > div');
					var menu = [];
					var current, current_name;
					function toParam(div) {
						if (div.hasClass('parent')) {
							var a = div.find('> a.setupFolder');
							if (a.length == 0) a = div.find('> span > a.setupFolder');
							var divs = div.find('> .childContainer > div');
							var child = $(divs).map(function () {
								return toParam($(this));
							}).toArray();
							return {
								id: div.attr('id'),
								href: a.attr('href'),
								title: a.html(),
								newflag: a.siblings('.newFlag').html(),
								child: child
							};
						} else if (div.hasClass('setupLeaf')) {
							var a = div.find('a');
							return {
								id: a.attr('id'),
								href: a.attr('href'),
								title: a.html(),
								newflag: a.siblings('.newFlag').html()
							};
						}
					};
					$(divs).each(function() {
						if ($(this).hasClass('setupNavtree')) {
							if (current_name) menu[menu.length - 1].child = current;
							current = [];
							current_name = $(this).find('a.setupSection').attr('id');
							var a = $(this).find('a');
							menu.push({
								id: a.attr('id'),
								href: a.attr('href'),
								title: a.html(),
								newflag: a.siblings('.newFlag').html()
							});
						} else if ($(this).hasClass('parent') || $(this).hasClass('setupLeaf')) {
							current.push(toParam($(this)));
						}
					});
					menu[menu.length - 1].child = current;
					menu[current_name] = current;
					writeSetupTab(menu);
				},
				error: function (res, status, error) {
					alert('Application error!');
				}
			});
		}
	});
})(jQuery.noConflict());
