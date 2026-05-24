import re

pages = {
    'index.html': {
        'title': 'Finance Bill 2026 Kenya | Official Review & Analysis',
        'description': 'Comprehensive review and analysis of Kenya Finance Bill 2026. Understand motor vehicle tax, eco levy, VAT changes, digital services tax and how they affect every Kenyan citizen.',
        'keywords': 'Finance Bill 2026 Kenya, Kenya tax 2026, motor vehicle tax Kenya, eco levy Kenya, VAT Kenya 2026, KRA tax changes, Finance Bill analysis, Kenya budget 2026',
        'url': 'https://www.financebill2026.co.ke/',
        'schema_type': 'WebSite'
    },
    'analysis.html': {
        'title': 'Finance Bill 2026 Analysis | Mwananchi Tax Guide Kenya',
        'description': 'Simple plain-language analysis of Kenya Finance Bill 2026. Learn how motor vehicle tax, eco levy, digital content tax and withholding tax changes affect ordinary Kenyans.',
        'keywords': 'Finance Bill 2026 analysis, Kenya tax analysis, motor vehicle tax 2026, eco levy analysis, withholding tax Kenya, mwananchi tax guide',
        'url': 'https://www.financebill2026.co.ke/analysis.html',
        'schema_type': 'Article'
    },
    'comparison.html': {
        'title': 'Finance Bill 2026 vs 2025 Comparison | Kenya Tax Changes',
        'description': 'Compare Kenya Finance Bill 2026 with previous tax frameworks. See what is new, what was reduced, and what enforcement measures are stricter for Kenyan taxpayers.',
        'keywords': 'Finance Bill 2026 comparison, Kenya tax changes 2026, Finance Bill 2025 vs 2026, new taxes Kenya, KRA enforcement 2026',
        'url': 'https://www.financebill2026.co.ke/comparison.html',
        'schema_type': 'Article'
    },
    'impact.html': {
        'title': 'Finance Bill 2026 Impact on Kenyans | Economic Effects',
        'description': 'Understand the public impact of Kenya Finance Bill 2026. How motor vehicle tax, eco levy, digital taxes and KRA enforcement affect your daily life and business.',
        'keywords': 'Finance Bill 2026 impact, Kenya tax impact, motor vehicle tax impact, eco levy impact, KRA 2026, Kenya economic impact',
        'url': 'https://www.financebill2026.co.ke/impact.html',
        'schema_type': 'Article'
    }
}

SEO_TEMPLATE = """    <!-- SEO Meta Tags -->
    <meta name="keywords" content="{keywords}">
    <meta name="author" content="Finance Bill 2026 Kenya Review">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{url}">

    <!-- Open Graph (WhatsApp, Facebook, LinkedIn previews) -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:url" content="{url}">
    <meta property="og:site_name" content="Finance Bill 2026 Kenya">
    <meta property="og:image" content="https://www.financebill2026.co.ke/images/kenya_finance_growth.png">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="https://www.financebill2026.co.ke/images/kenya_finance_growth.png">

    <!-- Structured Data (Schema.org) -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "{schema_type}",
        "name": "{title}",
        "description": "{description}",
        "url": "{url}",
        "publisher": {{
            "@type": "Organization",
            "name": "Finance Bill 2026 Kenya",
            "url": "https://www.financebill2026.co.ke"
        }},
        "about": {{
            "@type": "Thing",
            "name": "Kenya Finance Bill 2026",
            "description": "The Kenya Finance Bill 2026 (Gazette Supplement No. 113) proposes amendments to income tax, VAT, excise duty, and tax procedures."
        }}
    }}
    </script>"""

for fname, meta in pages.items():
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove any existing SEO block to avoid duplicates
    content = re.sub(r'\s*<!-- SEO Meta Tags -->.*?</script>', '', content, flags=re.DOTALL)

    # Build the SEO block
    seo_block = SEO_TEMPLATE.format(
        title=meta['title'],
        description=meta['description'],
        keywords=meta['keywords'],
        url=meta['url'],
        schema_type=meta['schema_type']
    )

    # Update title tag
    content = re.sub(r'<title>.*?</title>', f'<title>{meta["title"]}</title>', content)

    # Update description meta
    content = re.sub(r'<meta name="description"[^>]*>', f'<meta name="description" content="{meta["description"]}">', content)

    # Insert SEO block before </head>
    content = content.replace('</head>', seo_block + '\n</head>', 1)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'SEO added: {fname}')

print('Done!')
