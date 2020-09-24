// Object.assign(Inspire.plugins, {
// 	"syntax-breakdown": {
// 		test: ".syntax-breakdown",
// 		path: new URL("../inspire-plugins", location),
// 	},
// 	tree: {
// 		test: ".tree",
// 		path: new URL("../inspire-plugins", location),
// 	},
// 	"doc-view": {
// 		test: "*",
// 		path: new URL("../inspire-plugins", location),
// 	},
// 	"balance-lines": {
// 		test: ".balance-lines",
// 		path: new URL("../inspire-plugins", location),
// 	},
// });

// В слайдах с ссылками на внешние источники недопустимо использовать пробел внутри элемента —
// слайд с сайтом перестаёт отображаться. Нужно это исправить
$$(".slide[data-src]").forEach(slide => {
	slide.textContent = "";
});

// Make list items fall from the top one by one
for (let [i, li] of $$("#the-problem li:not(.special)").reverse().entries()) {
	li.style.transitionDelay = i * .5 + "s";
}

$.events(document, "slidechange", evt => {
	var slide = evt.target;

	// Create the videos for slides with a data-video attribute
	if (slide.matches(".slide[data-video]")) {
		let container = slide.classList.contains("cover") ? slide : $.create("div", {
			className: "browser",
			inside: slide
		});

		$.create("video", {
			src: slide.getAttribute("data-video"),
			loop: slide.classList.contains("looping"),
			inside: container
		});

		slide.classList.add("video");
		slide.removeAttribute("data-video");

		slide.classList.add("initialized");
	}

	$$(".slide:not(:target) video").forEach(video => {
		if (!video.paused) {
			video.pause();
		}
	});

	if (slide) {
		$$("video", slide).forEach(video => {
			video.loop = slide.classList.contains("looping");
			video.currentTime = 0;
			video.play();
		});
	}
});

$$(".quiz.slide").forEach((slide) => {
	let options = $(".options", slide);

	if (options) {
		options.classList.add("delayed-children");
		slide.dataset.steps = Number(slide.dataset.steps || 0) + 1;
	}
});

$$(".takeaway.slide h1").forEach((h1) => {
	h1.closest(".slide").classList.add("no-docs-icons");
	h1.classList.add("balance-lines");
	h1.insertAdjacentHTML("afterbegin", '<span class="label">На заметку</span>');
});

$$(".hover-explanations.slide").forEach((slide) => {
	var output = $.create("div", {
		className: "explanation",
		inside: slide,
	});

	const spans = "[data-explanation], code span[title], code a[title]";

	$$(spans, slide).forEach((span) => {
		span.tabIndex = 0;

		if (span.title && !span.dataset.explanation) {
			span.dataset.explanation = span.title;
			span.title = "";
		}
	});

	function explain(span) {
		var content =
			span.matches(".rich") || /<.+>/.test(span.innerHTML)
				? "innerHTML"
				: "textContent";

		output[content] = span.dataset.explanation;
	}

	$.bind(slide, {
		"mouseover focusin": (evt) => {
			var span = evt.target.closest(spans);

			if (span) {
				explain(span);
			}
		},
		"mouseout focusout": (evt) => {
			if (evt.type == "mouseout" && document.activeElement.matches(spans)) {
				explain(document.activeElement);
			} else {
				output.textContent = "";
			}
		},
	});
});

function createURL(html, type = "text/html") {
	html = html.replace(/&#x200b;/g, "");
	var blob = new Blob([html], { type });

	return URL.createObjectURL(blob);
}

function getText(selector, slide) {
	return (
		$$(selector, slide)
			.filter((code) => !code.matches(".runnable-ignore, .runnable-ignore *"))
			.map((code) => code.textContent || code.innerHTML)
			.join("\n") || ""
	);
}

$$(".runnable").forEach(async (slide) => {
	await Inspire.loadPlugin("live-demo");
	let getSelector = (...lang) =>
		lang.map((l) => `pre > code.language-${l}`).join(", ");
	let html = getText(getSelector("html", "markup"), slide);
	let js = getText(getSelector("js", "javascript"), slide);
	let css = getText(getSelector("css"), slide);
	let target = $(".run-target", slide);

	if (!target || target.matches("iframe")) {
		let url = createURL(
			Demo.getHTMLPage({
				title: (slide.title || slide.dataset.title || "") + " Demo",
				html,
				js,
				css,
			})
		);

		if (target) {
			target.src = url;

			if (!target.classList.contains("dont-resize")) {
				target.onload = (evt) => {
					let doc = evt.target.contentDocument;
					let resizeObserver = new ResizeObserver((entries) => {
						target.style.height =
							Math.max(
								doc.body.offsetHeight,
								doc.documentElement.offsetHeight
							) + "px";
					});
					resizeObserver.observe(doc.body);
				};
			}
		} else {
			let a = $.create("a", {
				className: "button new-tab",
				textContent: "Open in new Tab ↗️",
				inside: slide,
				target: "_blank",
				events: {
					"click mouseenter": (evt) => {
						a.href = url;
					},
				},
			});
		}
	} else {
		target.innerHTML = `${html}
			<style data-slide>${css}</style>`;
		slide.append($.create("script", { src: createURL(js, "text/javascript") }));
	}
});

$$(".hos.slide").forEach((slide) =>
	$.create("strong", {
		className: "ribbon",
		textContent: "UI Hall of Fame\n or Shame?",
		inside: $("h1", slide) || slide,
	})
);
$$(".hof.slide").forEach((slide) =>
	$.create("strong", {
		className: "ribbon",
		textContent: "UI Hall of Fame",
		inside: slide,
	})
);

$$(".slide.with-preview .code").forEach((code) => {
	const slide = Inspire.getSlide(code);
	let srcdoc = code.textContent;

	if (code.closest(".language-css")) {
		srcdoc = `<style>${srcdoc}</style>`;
	}

	const preview = $.create({
		className:
			"media-frame " +
			(slide.classList.contains("no-preview-delay") ? "" : "delayed"),
		contents: {
			tag: "iframe",
			srcdoc,
		},
	});

	code.after(preview);
});
