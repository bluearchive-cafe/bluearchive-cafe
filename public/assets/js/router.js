function render(page) {
    page = page || 'home';

    document.querySelectorAll('nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });


    const content = document.querySelectorAll('main, footer');
    content.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(50px)';
    });

    setTimeout(() => {
        document.querySelectorAll('article[data-page]').forEach(article => {
            article.style.display = (article.dataset.page === page) ? 'block' : 'none';
        });

        document.querySelector('footer').style.display = page === 'home' ? 'none' : 'block';

        if (page === 'status') fillStatus();

        content.forEach(element => {
            element.style.opacity = 1;
            element.style.transform = 'translateY(0)';
        });
    }, 200);
}
function navigate(page) {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const path = '/' + (page === 'home' ? '' : page);
    const checkTop = () => {
        const y = window.scrollY || document.documentElement.scrollTop;
        if (!y) {
            history.pushState({ page }, '', path);
            render(page);
        } else requestAnimationFrame(checkTop);
    };
    requestAnimationFrame(checkTop);
}

document.querySelectorAll('a[data-page]').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        if (link.classList.contains('active')) return;
        navigate(link.dataset.page);
    });
});

window.addEventListener('popstate', () => {
    render(history.state?.page || location.pathname.slice(1) || 'home');
});

render(location.pathname.slice(1));