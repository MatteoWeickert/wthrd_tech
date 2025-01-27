document.addEventListener('DOMContentLoaded', () => {
    const toc = document.getElementById('inhaltsverzeichnis');
    if (!toc) return;

    const tocTitle = document.createElement('h3');
    tocTitle.textContent = 'Inhaltsverzeichnis';
    toc.appendChild(tocTitle);

    const tocList = document.createElement('ul');
    toc.appendChild(tocList);

    document.querySelectorAll('h2').forEach((heading, index) => {
        const tocItem = document.createElement('li');
        const tocLink = document.createElement('a');
        const headingId = `heading-${index}`;
        
        heading.id = headingId;
        tocLink.href = `#${headingId}`;
        tocLink.textContent = heading.textContent;

        tocItem.appendChild(tocLink);
        tocList.appendChild(tocItem);
    });
});