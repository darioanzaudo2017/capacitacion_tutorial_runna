/* ═══════════════════════════════════════════════════
   RUNNA — Manual Interactivo v2.0
   script.js
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── DOM refs ─────────────────────────────────────
    const contentArea = document.getElementById('content-area');
    const breadcrumbCur = document.getElementById('breadcrumb-current');
    const moduleBadge = document.getElementById('module-badge');
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const progressFill = document.getElementById('progress-fill');
    const progressPct = document.getElementById('progress-pct');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const searchInput = document.getElementById('search-input');
    const toast = document.getElementById('toast');
    const resetBtn = document.getElementById('reset-progress-btn');

    // ─── Section order (for prev/next) ───────────────
    const SECTION_ORDER = [
        'intro',
        'flujo-general',
        'roles',
        'guia-modulos',
        'equivalencias',
        'mesa-entrada',
        'asignacion',
        'constatacion',
        'evaluacion',
        'proceso-mpi',
        'proceso-mpe',
        'proceso-mpj',
        'interfaz-mesa-entrada',
        'interfaz-legajos',
        'creacion-legajo-manual',
        'plan-trabajo'
    ];

    // ─── Progress tracking ────────────────────────────
    let visited = new Set(JSON.parse(localStorage.getItem('runna_visited') || '[]'));

    function saveVisited() {
        localStorage.setItem('runna_visited', JSON.stringify([...visited]));
    }

    function markVisited(id) {
        visited.add(id);
        saveVisited();
        updateProgress();
        const check = document.getElementById('check-' + id);
        if (check) check.classList.add('done');
    }

    function updateProgress() {
        const total = SECTION_ORDER.length;
        const done = SECTION_ORDER.filter(s => visited.has(s)).length;
        const pct = Math.round((done / total) * 100);
        progressFill.style.width = pct + '%';
        progressPct.textContent = pct + '%';
        // Update all checkmarks
        SECTION_ORDER.forEach(id => {
            const el = document.getElementById('check-' + id);
            if (el) el.classList.toggle('done', visited.has(id));
        });
    }

    resetBtn.addEventListener('click', () => {
        visited.clear();
        saveVisited();
        updateProgress();
        showToast('Progreso reiniciado');
    });

    // ─── Toast ────────────────────────────────────────
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ─── Lightbox ─────────────────────────────────────
    contentArea.addEventListener('click', e => {
        const img = e.target.closest('img');
        if (img && img.classList.contains('zoomable')) {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    });

    lightbox.addEventListener('click', closeLightbox);
    lightboxClose.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ─── Mobile sidebar ───────────────────────────────
    hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !hamburger.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // ─── Navigation ───────────────────────────────────
    let currentSection = '';

    function loadSection(id) {
        if (!SECTIONS[id]) id = 'intro';
        if (currentSection === id) return;
        currentSection = id;

        // Content
        contentArea.innerHTML = '';
        contentArea.classList.remove('page-enter');
        void contentArea.offsetWidth; // reflow
        contentArea.innerHTML = SECTIONS[id].html;
        contentArea.classList.add('page-enter');

        // Breadcrumb + badge
        breadcrumbCur.textContent = SECTIONS[id].title;
        const idx = SECTION_ORDER.indexOf(id);

        const moduleMap = {
            'mesa-entrada': 1,
            'asignacion': 2,
            'constatacion': 3,
            'evaluacion': 4,
            'proceso-mpi': 5,
            'proceso-mpe': 6,
            'proceso-mpj': 7,
            'plan-trabajo': 8
        };

        if (moduleMap[id]) {
            moduleBadge.textContent = `Módulo ${moduleMap[id]} / 8`;
            moduleBadge.style.display = 'flex';
        } else {
            moduleBadge.style.display = 'none';
        }

        // FAB visibility (hide on intro or map)
        const fab = document.getElementById('fab-map');
        if (fab) {
            fab.style.display = (id === 'intro' || id === 'flujo-general') ? 'none' : 'flex';
        }

        // Active nav item
        document.querySelectorAll('.nav-item').forEach(a => {
            a.classList.toggle('active', a.dataset.section === id);
        });

        // Prev / Next buttons
        const pos = SECTION_ORDER.indexOf(id);
        btnPrev.disabled = pos <= 0;
        btnNext.disabled = pos >= SECTION_ORDER.length - 1;
        btnPrev.textContent = pos > 0
            ? '← ' + SECTIONS[SECTION_ORDER[pos - 1]].title
            : '← Anterior';
        btnNext.textContent = pos < SECTION_ORDER.length - 1
            ? SECTIONS[SECTION_ORDER[pos + 1]].title + ' →'
            : 'Siguiente →';

        // Mark visited
        markVisited(id);

        // Close mobile sidebar
        if (window.innerWidth <= 768) sidebar.classList.remove('open');

        // Scroll top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Post-render hooks
        initSectionInteractivity(id);
    }

    btnPrev.addEventListener('click', () => {
        const pos = SECTION_ORDER.indexOf(currentSection);
        if (pos > 0) navigate(SECTION_ORDER[pos - 1]);
    });

    btnNext.addEventListener('click', () => {
        const pos = SECTION_ORDER.indexOf(currentSection);
        if (pos < SECTION_ORDER.length - 1) navigate(SECTION_ORDER[pos + 1]);
    });

    function navigate(id) {
        history.pushState({ section: id }, '', '#' + id);
        loadSection(id);
    }

    // Nav clicks (Generic for all hash links)
    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (a && a.getAttribute('href')?.startsWith('#')) {
            const id = a.getAttribute('href').replace('#', '');
            if (SECTIONS[id]) {
                e.preventDefault();
                navigate(id);
            }
        }
    });

    // ─── Search logic ─────────────────────────────────
    const searchResults = document.getElementById('search-results');

    function stripHtml(html) {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }

        const matches = [];

        // Búsqueda en el objeto SECTIONS
        for (const id in SECTIONS) {
            const section = SECTIONS[id];
            const title = section.title.toLowerCase();
            const rawContent = stripHtml(section.html);
            const content = rawContent.toLowerCase();

            if (title.includes(query) || content.includes(query)) {
                let snippet = "";
                if (content.includes(query)) {
                    const idx = content.indexOf(query);
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(rawContent.length, idx + 60);
                    snippet = (start > 0 ? "..." : "") + rawContent.substring(start, end) + (end < rawContent.length ? "..." : "");
                } else {
                    snippet = section.title;
                }

                matches.push({
                    id,
                    title: section.title,
                    snippet: snippet
                });
            }
        }

        renderSearchResults(matches, query);
    });

    function renderSearchResults(matches, query) {
        searchResults.innerHTML = '';
        if (matches.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No se encontraron coincidencias para "' + query + '"</div>';
        } else {
            matches.slice(0, 10).forEach(match => {
                const item = document.createElement('div');
                item.className = 'search-item';

                // Resaltado simple (usando negrita para el término buscado)
                const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const highlightedTitle = match.title.replace(new RegExp(`(${safeQuery})`, 'gi'), '<strong>$1</strong>');
                const highlightedSnippet = match.snippet.replace(new RegExp(`(${safeQuery})`, 'gi'), '<strong>$1</strong>');

                item.innerHTML = `
                    <span class="search-item-title">${highlightedTitle}</span>
                    <span class="search-item-snippet">${highlightedSnippet}</span>
                `;
                item.addEventListener('click', () => {
                    navigate(match.id);
                    searchResults.classList.remove('active');
                    searchInput.value = '';
                });
                searchResults.appendChild(item);
            });
        }
        searchResults.classList.add('active');
    }

    // Cerrar búsqueda al hacer clic fuera o presionar Esc
    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            searchResults.classList.remove('active');
            searchInput.blur();
        }
    });

    window.addEventListener('popstate', () => {
        const id = location.hash.replace('#', '') || 'intro';
        loadSection(id);
    });

    // Public helper for in-content links (supports optional anchor scrolling)
    window.navigateTo = (id, anchor) => {
        navigate(id);
        if (anchor) {
            setTimeout(() => {
                const el = document.getElementById(anchor);
                if (el) {
                    const headerOffset = 100;
                    const elementPosition = el.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }, 350);
        }
    };

    // ─── Search ───────────────────────────────────────
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) return;
            // Simple: find first section whose title or html contains the query
            const found = SECTION_ORDER.find(id => {
                const s = SECTIONS[id];
                return s.title.toLowerCase().includes(q) ||
                    s.html.toLowerCase().includes(q);
            });
            if (found) {
                navigate(found);
                searchInput.value = '';
                showToast('Sección encontrada: ' + SECTIONS[found].title);
            } else {
                showToast('No se encontraron resultados para "' + q + '"');
            }
        }, 400);
    });

    // ─── Post-render interactivity ────────────────────
    function initSectionInteractivity(id) {
        if (id === 'mesa-entrada') initStepper();
        if (id === 'flujo-general') initMapLinks();
    }

    function initStepper() {
        const stepper = document.getElementById('stepper-mesa');
        if (!stepper) return;
        stepper.addEventListener('click', e => {
            const btn = e.target.closest('.step-btn');
            if (!btn) return;
            const step = btn.dataset.step;
            stepper.querySelectorAll('.step-btn').forEach(b => b.classList.toggle('active', b.dataset.step === step));
            updateStepPanel(step);
        });
    }

    function updateStepPanel(step) {
        const panel = document.getElementById('step-panel');
        if (!panel) return;
        const data = STEP_DATA[step];
        if (!data) return;

        const roleTags = (data.roles || []).map(r => `<span class="role-tag ${r}">${getRoleName(r)}</span>`).join('');

        // Soporte para múltiples imágenes o una sola
        const images = data.images || [{ img: data.image || data.img, caption: data.caption }];
        const imagesHtml = images.map(item => `
            <div class="img-wrap" style="margin-bottom:16px;">
                <img src="${item.img}" alt="${data.title}" class="zoomable">
                <div class="img-caption">${item.caption}</div>
            </div>
        `).join('');

        panel.innerHTML = `
            <div class="step-panel-header">
                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                    <span class="step-num" style="background: var(--blue-100); color: var(--blue-700); width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-weight:700;font-size:13px;">${step}</span>
                    <h3>${data.title}</h3>
                </div>
                <div class="tl-roles">${roleTags}</div>
            </div>
            <div class="step-panel-body">
                ${imagesHtml}
                <ul>${(data.items || []).map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
        `;
    }

    function getRoleName(roleClass) {
        switch (roleClass) {
            case 'role-tecnico': return 'Técnico/a';
            case 'role-director': return 'Director/a';
            case 'role-mesa': return 'Mesa de Entrada';
            case 'role-legales': return 'Legales';
            case 'role-jz': return 'Jefatura de Zona';
            default: return 'Usuario';
        }
    }

    function initMapLinks() {
        document.querySelectorAll('.map-node[data-section]').forEach(el => {
            el.addEventListener('click', () => navigate(el.dataset.section));
        });
    }

    // ─── Step Data (Mesa de Entrada) ──────────────────
    const STEP_DATA = {
        '1': {
            title: "Paso 1: Selección de Objetivo",
            roles: ['role-mesa'],
            image: "assets/step1.png",
            caption: "Selección de Objetivo — El sistema diferencia entre Protección (Canal A) u Oficio (Canal B). Esta decisión es fundamental ya que condiciona los campos del formulario y el flujo jerárquico posterior.",
            items: [
                'Seleccioná <strong>Protección</strong> para casos de vulneración de derechos.',
                'Definí el <strong>Equipo de Trabajo</strong> (ej: Zonal, Guardia, etc.).',
                'Podés cargar archivos adjuntos (denuncias PDF/escaneos).'
            ]
        },
        '2': {
            title: "Paso 2: Información de Origen",
            roles: ['role-mesa'],
            image: "assets/step2.png",
            caption: "Información de Origen — Registro de la procedencia de la demanda (comisaría, hospital, escuela, etc.). Es vital para establecer la trazabilidad y la responsabilidad institucional del reporte.",
            items: [
                'Registrá fecha, hora y medio de ingreso.',
                'Identificá el origen (ej: Línea 102, Escuela, Hospital).',
                'Resumen breve del motivo de intervención.'
            ]
        },
        '3': {
            title: "Paso 3: Adultos Referentes",
            roles: ['role-mesa'],
            image: "assets/Adultos1.png",
            caption: "Grupo Familiar — Carga de datos de identidad de los adultos referentes. El sistema detecta automáticamente antecedentes si los DNI ya existen en la base de datos municipal.",
            items: [
                'Cargá DNI, nombre y datos de contacto de adultos.',
                'Vinculá el parentesco con el NNyA.',
                'El sistema detecta convivencias previas automáticamente.'
            ]
        },
        '4': {
            title: "Paso 4: Datos del NNyA",
            roles: ['role-mesa'],
            image: "assets/nnya1.png",
            caption: "Legajo del NNyA — Carga técnica detallada del niño o adolescente. Incluye geolocalización del domicilio y el resumen técnico de la situación de riesgo detectada.",
            items: [
                '<strong>Datos Generales:</strong> Identidad, género y domicilio.',
                '<strong>Educación:</strong> <img src="assets/nnyaeducacion.png" class="mini-img" /> Nivel y escolaridad.',
                '<strong>Salud:</strong> <img src="assets/nnyasalud.png" class="mini-img" /> Cobertura y estado médico.',
                '<strong>Vulneraciones:</strong> <img src="assets/nnyavulneracion.png" class="mini-img" /> Selección de tipos de maltrato o derechos vulnerados.'
            ]
        },
        '5': {
            title: "Finalización de Mesa",
            roles: ['role-mesa'],
            images: [
                {
                    img: "assets/confirmacion-demanda.png",
                    caption: "Finalización del Registro — Vista previa de los datos. Al confirmar, se genera el número de demanda único para el seguimiento en las bandejas de trabajo."
                }
            ],
            items: [
                "Verificá que todos los datos del NNyA sean correctos.",
                "Confirmá la creación de la demanda para obtener el número de seguimiento único.",
                "El sistema derivará automáticamente el caso a la bandeja del equipo que fue registrado en la demanda."
            ]
        }
    };

    // ═══════════════════════════════════════════════════
    //   SECTIONS CONTENT
    // ═══════════════════════════════════════════════════
    const SECTIONS = {

        // ── INTRO ───────────────────────────────────────
        'intro': {
            title: 'Login e Introducción',
            html: `
                <div class="intro-hero">
                    <span class="hero-tag">CAPACITACIÓN v2.0</span>
                    <h1>Acceso al Sistema y Flujo de Trabajo</h1>
                    <p>Bienvenido al Manual Interactivo de RUNNA. En este módulo aprenderás a ingresar al sistema y comprenderás la arquitectura de los 7 módulos técnicos.</p>
                </div>

                <div class="img-wrap" style="margin-top:20px;">
                    <img src="assets/nuevademandaoficiojudicial.png" alt="Nuevo Oficio" class="zoomable" />
                    <div class="img-caption">Ingreso de Oficio — Registro de demandas que provienen directamente de juzgados, con prioridad de atención por plazos judiciales.</div>
                </div>

                <div class="module-grid">
                    <div class="module-card" onclick="navigateTo('mesa-entrada')">
                        <span class="mc-tag">Módulo 1</span>
                        <span class="mc-title">Mesa de Entrada</span>
                    </div>
                    <div class="module-card" onclick="navigateTo('asignacion')">
                        <span class="mc-tag">Módulo 2</span>
                        <span class="mc-title">Asignación</span>
                    </div>
                    <div class="module-card" onclick="navigateTo('constatacion')">
                        <span class="mc-tag">Módulo 3</span>
                        <span class="mc-title">Constatación</span>
                    </div>
                    <div class="module-card" onclick="navigateTo('evaluacion')">
                        <span class="mc-tag">Módulo 4</span>
                        <span class="mc-title">Evaluación</span>
                    </div>
                    <div class="module-card" onclick="navigateTo('proceso-mpi')">
                        <span class="mc-tag">Módulo 5</span>
                        <span class="mc-title">MPI</span>
                    </div>
                    <div class="module-card" onclick="navigateTo('proceso-mpe')">
                        <span class="mc-tag">Módulo 6</span>
                        <span class="mc-title">MPE</span>
                    </div>
                    <div class="module-card" onclick="navigateTo('plan-trabajo')">
                        <span class="mc-tag">Módulo 7</span>
                        <span class="mc-title">Plan Trabajo</span>
                    </div>
                </div>
            `
        },

        roles: {
            title: "Roles y Usuarios",
            html: `
                <div class="page-header">
                    <span class="module-tag">Directorio Humano</span>
                    <h1>Roles y Responsabilidades</h1>
                    <p class="subtitle">El sistema RUNNA opera bajo un modelo de colaboración jerárquica. Cada intervención requiere la participación de distintos perfiles técnicos para asegurar la protección del NNyA.</p>
                </div>

                <div class="roles-grid">
                    <div class="role-card">
                        <div class="role-header">
                            <span class="role-tag role-mesa">Mesa de Entrada</span>
                            <h3>Recepción y Registro</h3>
                        </div>
                        <p>Es el punto de inicio. Responsable del ingreso manual de denuncias u oficios, validación de la identidad del NNyA en la base nominal y derivación al área técnica correspondiente (Canal A o B).</p>
                    </div>

                    <div class="role-card">
                        <div class="role-header">
                            <span class="role-tag role-tecnico">Técnico/a</span>
                            <h3>Intervención Territorial</h3>
                        </div>
                        <p>Responsable directo del caso. Realiza visitas, entrevistas y gestiones de campo. Elabora los Informes Técnicos, propone Medidas de Protección y ejecuta el seguimiento mensual.</p>
                    </div>

                    <div class="role-card">
                        <div class="role-header">
                            <span class="role-tag role-director">Director/a</span>
                            <h3>Supervisión Estratégica</h3>
                        </div>
                        <p>Máxima autoridad institucional del sistema, por encima de las Jefaturas de Zona. Autoriza evaluaciones de medidas, aprueba aperturas, innovaciones, prórrogas y ceses ingresando la nota de aval correspondiente, valida actividades de control de legalidad y gestiona la asignación de responsables de legajos y actividades.</p>
                    </div>

                    <div class="role-card">
                        <div class="role-header">
                            <span class="role-tag role-jz">Jefatura de Zona (JZ)</span>
                            <h3>Autoridad Regional</h3>
                        </div>
                        <p>Máxima autoridad institucional en el territorio. Autoriza decisiones de evaluación, aprueba aperturas de medidas excepcionales y de protección, valida actividades de control de legalidad y gestiona la asignación y transferencia de legajos y responsables.</p>
                    </div>

                    <div class="role-card">
                        <div class="role-header">
                            <span class="role-tag role-legales">Legales</span>
                            <h3>Asesoría Jurídica</h3>
                        </div>
                        <p>Gestiona los procesos jurídicos del sistema en dos áreas: Penal Juvenil, donde carga oficios judiciales, genera actividades y las visa una vez aprobadas; y Protección, donde elabora informes jurídicos y registra ratificaciones de Medidas de Excepción.</p>
                    </div>
                </div>

                <div class="divider"></div>

                <div class="callout info">
                    <span class="callout-icon">💡</span>
                    <div class="callout-body">
                        <strong>Trazabilidad Jerárquica</strong>
                        <p>Casi todos los procesos en RUNNA requieren un doble o triple visado (Técnico → Director → JZ/Legales), garantizando que las decisiones sobre la vida de un NNyA sean colegiadas y fundadas.</p>
                    </div>
                </div>
            `
        },

        'interfaz-mesa-entrada': {
            title: 'Guía: Mesa de Entrada',
            html: `
                <div class="page-header">
                    <span class="module-tag">GUÍA DE INTERFAZ</span>
                    <h1>Mesa de Entrada: Gestión y Herramientas</h1>
                    <p class="subtitle">La bandeja de entrada permite procesar grandes volúmenes de casos mediante herramientas de filtrado dinámico y acciones rápidas.</p>
                </div>

                <div class="img-wrap zoomable mb-4">
                    <img src="assets/inbox-main.png" alt="Mesa de Entrada Dashboard">
                    <div class="img-caption">Vista General — Panel principal con indicadores de demanda y herramientas de administración.</div>
                </div>

                <div class="roles-grid">
                    <div class="role-card">
                        <div class="role-header">
                            <span class="role-tag role-mesa"><i class="fas fa-filter"></i> Filtros y Búsqueda</span>
                        </div>
                        <div class="role-content">
                            <img src="assets/inbox-filters.png" alt="Panel de Filtros" class="zoomable mb-3" style="border-radius: 8px;">
                            <ul class="custom-list">
                                <li><strong>Buscador Global:</strong> Localiza NNyA por nombre, DNI o número de demanda.</li>
                                <li><strong>Panel Lateral:</strong> Filtrá por tipo de respuesta, estado, origen y más.</li>
                            </ul>
                        </div>
                    </div>

                    <div class="role-card">
                        <div class="role-header">
                            <span class="role-tag role-tecnico"><i class="fas fa-columns"></i> Columnas y Orden</span>
                        </div>
                        <div class="role-content">
                            <div class="img-row" style="display: flex; gap: 10px; margin-bottom: 15px;">
                                <img src="assets/inbox-columns.png" alt="Columnas" style="width: 48%; border-radius: 4px;">
                                <img src="assets/inbox-sort.png" alt="Orden" style="width: 48%; border-radius: 4px;">
                            </div>
                            <ul class="custom-list">
                                <li><strong>Columnas:</strong> Personalizá tu bandeja eligiendo qué datos ver.</li>
                                <li><strong>Ordenar/Filtrar:</strong> Cada columna permite reordenar o filtrar valores únicos.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="step-card mt-4">
                    <div class="step-header"><div class="step-title">Indicadores y Acciones en Fila</div></div>
                    <div class="step-content">
                        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 15px;">
                            <img src="assets/inbox-row.png" alt="Fila" class="zoomable" style="max-height: 80px; border-radius: 4px;">
                            <p>Identificá el estado del caso sin abrir el registro:</p>
                        </div>
                        <div class="roles-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                            <div class="role-card small-card">
                                <i class="fas fa-eye text-primary"></i> <strong>Ver:</strong> Acceso al legajo.
                            </div>
                            <div class="role-card small-card">
                                <i class="fas fa-user-plus text-info"></i> <strong>Asignar:</strong> Derivación rápida.
                            </div>
                            <div class="role-card small-card">
                                <i class="fas fa-paperclip text-success"></i> <strong>Adjuntos:</strong> Archivos vinculados.
                            </div>
                            <div class="role-card small-card">
                                <i class="fas fa-file-medical text-warning"></i> <strong>Legajo:</strong> Antecedentes.
                            </div>
                        </div>
                    </div>
                </div>
            `
        },

        'interfaz-legajos': {
            title: 'Guía: Pantalla de Legajos',
            html: `
                <div class="page-header">
                    <span class="module-tag">EXPEDIENTE DIGITAL</span>
                    <h1>Guía de Pantalla: Legajos</h1>
                    <p class="subtitle">El legajo centraliza toda la intervención del NNyA. Cada pestaña organiza una dimensión específica del caso.</p>
                </div>

                <div class="interface-grid">
                    <!-- Bandeja Global -->
                    <div class="tool-card full-width">
                        <div class="tool-header">
                            <i class="fas fa-list-ul"></i>
                            <h3>Bandeja de Legajos (Lista Global)</h3>
                        </div>
                        <img src="assets/legajo-bandeja.png" alt="Bandeja de Legajos" class="img-fluid rounded mb-3 border shadow-sm">
                        <div class="tool-content">
                            <p>Es el panel principal donde se visualizan todos los NNyA con intervención. Permite una búsqueda rápida por ID, DNI o Nombre.</p>
                            <div class="interface-grid">
                                <div>
                                    <ul>
                                        <li><strong>Buscador Inteligente:</strong> Filtra por ID de Legajo, DNI o Nombre completo.</li>
                                        <li><strong>Alertas de Prioridad:</strong> Identificación visual por colores (Alta, Media, Baja).</li>
                                        <li><strong>Acceso Directo:</strong> Botones rápidos para ver el legajo, asignar responsables o ver medidas.</li>
                                    </ul>
                                </div>
                                <div class="alert alert-info">
                                    <i class="fas fa-filter"></i> Usá los filtros avanzados para segmentar por "Tipo de Medida" o "Andarivel".
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pestaña General/Asignaciones -->
                    <div class="tool-card full-width">
                        <div class="tool-header">
                            <i class="fas fa-id-card"></i>
                            <h3>Datos y Asignaciones (Vista del Legajo)</h3>
                        </div>
                        <img src="assets/legajo-general.png" alt="Vista General Legajo" class="img-fluid rounded mb-3 border shadow-sm">
                        <div class="tool-content">
                            <p>Contiene la información biográfica del NNyA, el historial de equipos/técnicos responsables y el registro de medidas tomadas. Es el punto de partida para conocer quién está interviniendo.</p>
                            <div class="tag-group">
                                <span class="status-pill status-pending">Identidad</span>
                                <span class="status-pill status-pending">Equipos</span>
                                <span class="status-pill status-pending">Medidas</span>
                            </div>
                        </div>
                    </div>

                    <!-- Pestaña Oficios -->
                    <div class="tool-card">
                        <div class="tool-header">
                            <i class="fas fa-file-contract"></i>
                            <h3>Oficios</h3>
                        </div>
                        <img src="assets/legajo-oficios.png" alt="Oficios" class="img-fluid rounded mb-3 border shadow-sm">
                        <div class="tool-content">
                            <p>Repositorio de órdenes judiciales vinculadas. Permite descargar los archivos PDF de los oficios recibidos.</p>
                        </div>
                    </div>

                    <!-- Pestaña Demandas -->
                    <div class="tool-card">
                        <div class="tool-header">
                            <i class="fas fa-bullhorn"></i>
                            <h3>Demandas Relacionadas</h3>
                        </div>
                        <img src="assets/legajo-demandas.png" alt="Demandas" class="img-fluid rounded mb-3 border shadow-sm">
                        <div class="tool-content">
                            <p>Historial de todas las demandas de protección. Indica el origen, el objetivo de la intervención y el estado actual de cada una.</p>
                        </div>
                    </div>

                    <!-- Pestaña Documentos -->
                    <div class="tool-card">
                        <div class="tool-header">
                            <i class="fas fa-folder-open"></i>
                            <h3>Repositorio de Documentos</h3>
                        </div>
                        <img src="assets/legajo-documentos.png" alt="Documentos" class="img-fluid rounded mb-3 border shadow-sm">
                        <div class="tool-content">
                            <p>Carpeta digital dividida por etapas (Demanda, Medida). Centraliza todos los informes y actas cargadas al sistema.</p>
                        </div>
                    </div>

                    <!-- Pestaña Plan de Trabajo -->
                    <div class="tool-card full-width">
                        <div class="tool-header">
                            <i class="fas fa-tasks"></i>
                            <h3>Plan de Trabajo (Gestión de Actividades)</h3>
                        </div>
                        <img src="assets/legajo-plan.png" alt="Plan de Trabajo" class="img-fluid rounded mb-3 border shadow-sm">
                        <div class="tool-content">
                            <div class="interface-grid">
                                <div>
                                    <p>Aquí se gestiona el día a día de la intervención:</p>
                                    <ul>
                                        <li><strong>Semáforo de Tareas:</strong> Contadores de pendientes, realizadas y vencidas.</li>
                                        <li><strong>Barra de Progreso:</strong> Porcentaje de cumplimiento del plan vigente.</li>
                                        <li><strong>Tabla de Actividades:</strong> Detalle de cada acción con su responsable y fecha límite.</li>
                                    </ul>
                                </div>
                                <div class="alert alert-info">
                                    <i class="fas fa-lightbulb"></i> Usá los filtros superiores para ver solo tus actividades asignadas.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pestaña Auditoría -->
                    <div class="tool-card">
                        <div class="tool-header">
                            <i class="fas fa-history"></i>
                            <h3>Historial de Auditoría</h3>
                        </div>
                        <img src="assets/legajo-auditoria.png" alt="Auditoría" class="img-fluid rounded mb-3 border shadow-sm">
                        <div class="tool-content">
                            <p>Registro automático de cada acción realizada: quién editó, qué campo se cambió y en qué fecha exacta.</p>
                        </div>
                    </div>
                </div>
            `
        },

        'creacion-legajo-manual': {
            title: 'Creación de Legajo Manual',
            html: `
                <div class="page-header">
                    <span class="module-tag">MODO MANUAL</span>
                    <h1>Creación Manual de Legajo</h1>
                    <p class="subtitle">Este módulo explica cómo registrar un legajo directamente cuando no proviene de una demanda previa en Mesa de Entrada.</p>
                </div>

                <div class="step-card">
                    <div class="step-header">
                        <div class="step-title">Paso 1: Buscar NNyA Existente</div>
                    </div>
                    <div class="step-content">
                        <img src="assets/crear-legajo-paso1.png" alt="Paso 1" class="zoomable mb-3">
                        <p>Antes de crear un legajo, es obligatorio verificar si el NNyA ya existe. Esto evita la duplicación de datos (LEG-01). Se puede buscar por DNI o por Nombre completo.</p>
                    </div>
                </div>

                <div class="step-card">
                    <div class="step-header">
                        <div class="step-title">Paso 2: Datos Personales</div>
                    </div>
                    <div class="step-content">
                        <img src="assets/crear-legajo-paso2.png" alt="Paso 2" class="zoomable mb-3">
                        <p>Carga los datos biográficos esenciales: Nombre, Apellido, DNI, Fecha de Nacimiento y Domicilio. El sistema valida automáticamente los campos obligatorios marcados con asterisco (*).</p>
                    </div>
                </div>

                <div class="step-card">
                    <div class="step-header">
                        <div class="step-title">Paso 3: Asignación de Legajo</div>
                    </div>
                    <div class="step-content">
                        <img src="assets/crear-legajo-paso3.png" alt="Paso 3" class="zoomable mb-3">
                        <p>Define la urgencia y asigna el legajo a una zona y un responsable técnico. También es necesario registrar el <strong>Centro de Vida</strong> para garantizar la territorialidad de la intervención.</p>
                    </div>
                </div>

                <div class="step-card">
                    <div class="step-header">
                        <div class="step-title">Paso 4: Confirmación</div>
                    </div>
                    <div class="step-content">
                        <img src="assets/crear-legajo-paso4.png" alt="Paso 4" class="zoomable mb-3">
                        <p>Revisión final de los datos ingresados. Al hacer clic en "Crear Legajo", el sistema generará automáticamente el número de legajo único y lo dejará disponible en la bandeja de trabajo del responsable.</p>
                    </div>
                </div>
            `
        },

        'flujo-general': {
            title: 'Mapa del Sistema',
            html: `
                <div class="page-header">
                    <span class="module-tag">ESTRUCTURA TÉCNICA</span>
                    <h1>Mapa de Navegación</h1>
                    <p class="subtitle">Visión completa del ciclo de vida de una demanda. Hacé clic en los módulos para navegar.</p>
                </div>

                <div class="v-map-wrapper">
                    <div class="v-map">
                        
                        <!-- Inicio -->
                        <div class="v-node root" onclick="navigateTo('intro')">
                            <span class="v-tag">Inicio</span>
                            Login e Introducción
                        </div>

                        <!-- Creación Manual -->
                        <div class="v-node" onclick="navigateTo('creacion-legajo-manual')" style="border-style: dashed; background: rgba(59, 130, 246, 0.05);">
                            <span class="v-tag">Opcional</span>
                            Creación Manual de Legajo
                        </div>

                        <div class="v-node" onclick="navigateTo('mesa-entrada')">
                            <span class="v-tag">Módulo 1</span>
                            Mesa de Entrada
                        </div>

                        <div class="v-node" onclick="navigateTo('mesa-entrada')">
                            <span class="v-tag">Registro</span>
                            Nuevo Registro de Demanda
                        </div>

                        <!-- Fork -->
                        <div class="v-fork-container">
                            <div class="v-fork-line"></div>
                            
                            <!-- Branch Protección -->
                            <div class="v-branch">
                                <div class="v-node protection" onclick="navigateTo('mesa-entrada')">
                                    <span class="v-tag">Canal A</span>
                                    Protección (RUNNA)
                                </div>
                                <div class="v-node protection" onclick="navigateTo('mesa-entrada')">
                                    Mesa de Entrada
                                </div>
                                <div class="v-node protection" onclick="navigateTo('asignacion')">
                                    <span class="v-tag">Módulo 2</span>
                                    Asignación de Demanda
                                </div>
                                <div class="v-node protection" onclick="navigateTo('constatacion')">
                                    <span class="v-tag">Módulo 3</span>
                                    Constatación
                                </div>
                                <div class="v-node protection" onclick="navigateTo('evaluacion')">
                                    <span class="v-tag">Módulo 4</span>
                                    Evaluación Técnica
                                </div>
                                
                                <div class="v-node protection" onclick="navigateTo('evaluacion')">
                                    <span class="v-tag">Decisión</span>
                                    Medida de Protección
                                </div>

                                <div class="v-fork-container" style="gap: 20px; margin: 0;">
                                    <div class="v-node end" onclick="navigateTo('proceso-mpi')">
                                        <span class="v-tag">Módulo 5</span>
                                        MPI
                                    </div>
                                    <div class="v-node end" onclick="navigateTo('proceso-mpe')">
                                        <span class="v-tag">Módulo 6</span>
                                        MPE
                                    </div>
                                </div>
                            </div>

                            <!-- Branch Oficio -->
                            <div class="v-branch">
                                <div class="v-node judicial" onclick="navigateTo('proceso-mpj', 'mpj-registro')">
                                    <span class="v-tag">Canal B</span>
                                    Oficio Judicial
                                     <div style="font-size: 10px; margin-top: 4px; opacity: 0.8; font-weight: 400;">Un oficio puede generar actividades para MPJ, MPE y MPI.</div>
                                </div>
                                <div class="v-node judicial" onclick="navigateTo('proceso-mpj', 'mpj-asignacion-equipo')">
                                    Asignación a Equipo
                                </div>
                                <div class="v-node judicial" onclick="navigateTo('proceso-mpj', 'mpj-asignacion-tecnico')">
                                    Asignación a Técnico
                                </div>
                                <div class="v-node judicial" onclick="navigateTo('proceso-mpj', 'mpj-tecnico-actividades')">
                                    Completar Actividades
                                </div>
                                <div class="v-node judicial" onclick="navigateTo('proceso-mpj', 'mpj-director-aprobacion')">
                                    Aprobación Director
                                </div>
                                <div class="v-node judicial" onclick="navigateTo('proceso-mpj', 'mpj-visado-legal')">
                                    Visado de Legales
                                </div>
                            </div>
                        </div>

                        <!-- Final Transversal -->
                        <div class="v-node root" onclick="navigateTo('plan-trabajo')">
                            <span class="v-tag">Módulo 7</span>
                            Plan de Trabajo (Transversal)
                        </div>

                    </div>
                </div>

                <div class="callout tip">
                    <span class="callout-icon">💡</span>
                    <div class="callout-body">
                        <strong>Navegación Interactiva</strong>
                        <p>Podés hacer clic en cualquier nodo de color para saltar directamente a ese módulo del manual.</p>
                    </div>
                </div>
            `
        },

        'mesa-entrada': {
            title: 'Mesa de Entrada',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 1</span>
                    <h1>Registro de Demanda</h1>
                    <p class="subtitle">Primer punto de contacto. Carga de datos de protección u oficio judicial.</p>
                </div>

                <div class="stepper" id="stepper-mesa">
                    <button class="step-btn active" data-step="1">Objetivo</button>
                    <button class="step-btn" data-step="2">General</button>
                    <button class="step-btn" data-step="3">Adultos</button>
                    <button class="step-btn" data-step="4">NNyA</button>
                    <button class="step-btn" data-step="5">Finalización de la demanda inicial</button>
                </div>

                <div id="step-panel" class="step-panel">
                    <!-- Dinámico -->
                </div>
            `
        },

        'asignacion': {
            title: 'Asignación',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 2</span>
                    <div class="tl-roles" style="margin-bottom:8px;"><span class="role-tag role-director">Director/a · JZ</span></div>
                    <h1>Asignación y Derivación</h1>
                    <p class="subtitle">El Director/a o JZ asigna el caso a un profesional/equipo específico.</p>
                </div>

                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">A</div>
                        <div class="tl-content">
                            <span class="tl-title">Bandeja de Pendientes</span>
                            <div class="img-wrap">
                                <img src="assets/asignardemanda.png" alt="Asignar Demanda" class="zoomable" />
                                <div class="img-caption">Gestión de la Bandeja — El Director visualiza las demandas admitidas por Mesa de Entrada y utiliza este botón para iniciar la derivación técnica.</div>
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">B</div>
                        <div class="tl-content">
                            <span class="tl-title">Gestión de Profesional</span>
                            <div class="img-wrap">
                                <img src="assets/modalasignardemanda.png" alt="Modal Asignar" class="zoomable" />
                                <div class="img-caption">Designación de Responsable — Interfaz para seleccionar al técnico o equipo. El sistema permite filtrar por especialidad o carga de trabajo actual del personal.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },

        'constatacion': {
            title: 'Constatación',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 3</span>
                    <h1>Intervención y Constatación</h1>
                    <p class="subtitle">Visitas territoriales y chequeo inicial de los derechos vulnerados.</p>
                </div>

                <div class="img-wrap">
                    <img src="assets/demandaenestadodeconstatacion.png" alt="Estado Constatación" class="zoomable" />
                    <div class="img-caption">Fase Territorial — El legajo se encuentra en estado 'Constatación'. El equipo técnico debe realizar las visitas y entrevistas para validar la situación inicial.</div>
                </div>

                <div class="callout info">
                    <span class="callout-icon">📍</span>
                    <div class="callout-body">
                        <strong>Actuación Técnica</strong>
                        <p>En esta etapa se cargan las cronologías iniciales antes de elevar a Evaluación.</p>
                    </div>
                </div>

                <h2 class="section-heading">Edición del registro</h2>
                <p style="font-size:14px;color:var(--gray-600);margin-bottom:16px;">En este estado el técnico/a puede editar y completar la información de <strong>Adultos Convivientes</strong>, <strong>NNyA</strong> e <strong>Información General</strong>.</p>

                <div class="img-wrap">
                    <img src="assets/constatacion1.png" alt="Planilla de constatación" class="zoomable" />
                    <div class="img-caption">Planilla de edición de demanda en estado Constatación.</div>
                </div>

                <h2 class="section-heading">Acciones disponibles</h2>

                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">A</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Enviar Respuestas</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">Comunicación formal vía mail desde el sistema. Queda registro de cada envío.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/envioderespuestaconstatacion.png" alt="Módulo mensajería" class="zoomable" />
                                <div class="img-caption">Módulo de mensajería para respuestas oficiales.</div>
                            </div>
                        </div>
                    </div>

                    <div class="tl-item">
                        <div class="tl-dot">B</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Registrar Actividades</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">Documentar visitas, entrevistas y llamadas en la cronología de intervenciones.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/registrodeactividadconstatacion.png" alt="Registro de actividad" class="zoomable" />
                                <div class="img-caption">Formulario de cronología de intervenciones realizadas.</div>
                            </div>
                        </div>
                    </div>

                    <div class="tl-item">
                        <div class="tl-dot">C</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Vincular Legajos</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">Conectar la demanda con antecedentes o legajos abiertos relacionados.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/conexionesdemandaylegajos.png" alt="Conexión de legajos" class="zoomable" />
                                <div class="img-caption">Interfaz de vinculación con otros legajos del sistema.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },

        'evaluacion': {
            title: 'Evaluación Técnica',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 4</span>
                    <h1>Evaluación Técnica e Informe 100</h1>
                    <p class="subtitle">Cuando el técnico/a tiene información suficiente, inicia la evaluación para determinar el curso de acción legal.</p>
                </div>

                <div class="callout info">
                    <span class="callout-icon">👤</span>
                    <div class="callout-body">
                        <strong>Roles involucrados</strong>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                            <span class="role-tag role-tecnico">Técnico/a</span>
                            <span class="role-tag role-director">Director/a · JZ</span>
                        </div>
                    </div>
                </div>

                <div style="margin:20px 0;">
                    <span class="status-pill pill-evaluacion">Evaluación</span>
                </div>

                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">1</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Chequeo de Información</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">El sistema consolida todos los datos cargados en Constatación para revisión final antes de emitir el informe.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/evaluacion cheque de informacion.png" alt="Check Información" class="zoomable" />
                                <div class="img-caption">Auditoría de Datos — Antes de emitir el Informe 100, el sistema presenta un resumen de lo constatado para asegurar la coherencia técnica de la decisión.</div>
                            </div>
                        </div>
                    </div>

                    <div class="tl-item">
                        <div class="tl-dot">2</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Descripción e Indicadores</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">Se detallan los hechos y se marcan los indicadores de vulneración de derechos detectados durante la constatación.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/evaluaciondescripciondesituacioneindicadores.png" alt="Indicadores" class="zoomable" />
                                <div class="img-caption">Diagnóstico Técnico — Espacio para la redacción detallada de la situación actual. Se deben marcar los indicadores de riesgo que sustentan la estrategia de protección propuesta.</div>
                            </div>
                        </div>
                    </div>

                    <div class="tl-item">
                        <div class="tl-dot">3</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Valoración y Justificación</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">El profesional realiza su análisis técnico y justifica la medida sugerida.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/evaluacionvaloraciony justificacion.png" alt="Valoración" class="zoomable" />
                                <div class="img-caption">Fundamentación Legal — Justificación técnica de por qué se propone una medida de protección. Este texto es la base jurídica para los informes que se enviarán a JZ y Legales.</div>
                            </div>
                        </div>
                    </div>

                    <div class="tl-item">
                        <div class="tl-dot">4</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Selección de Medida y Autorización</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span><span class="role-tag role-director">Director/a</span></div>
                            </div>
                            <p class="tl-body">Se selecciona la medida (MPI o MPE) y se envía el pedido de autorización al Director/a o JZ.</p>

                            <div class="callout warning" style="margin:12px 0 0;">
                                <span class="callout-icon">📄</span>
                                <div class="callout-body">
                                    <strong>Informe 100</strong>
                                    <p>Al guardar esta etapa el sistema genera automáticamente el <strong>Informe 100 en PDF</strong>, documento legal que respalda la intervención.</p>
                                </div>
                            </div>

                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/evaluaciondesicionMPIpedido de autorizacion.png" alt="Pedido de autorización" class="zoomable" />
                                <div class="img-caption">Dictamen de Medida — Selección formal entre MPI o MPE. Al solicitar autorización, se dispara el circuito de firmas digitales necesario para validar la medida.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },

        // ── PROCESO MPI ────────────────────────────────
        'proceso-mpi': {
            title: 'Medida Integral (MPI)',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 5</span>
                    <h1>Medida de Protección Integral (MPI)</h1>
                    <p class="subtitle">Acciones para restituir derechos manteniendo al NNyA en su entorno.</p>
                </div>

                <div class="callout tip">
                    <span class="callout-icon">🛡️</span>
                    <div class="callout-body">
                        <strong>Estructura de la Medida</strong>
                        <p>La MPI se divide en tres fases críticas: <strong>Apertura</strong>, <strong>Gestión/Seguimiento</strong> y <strong>Cierre</strong>.</p>
                    </div>
                </div>

                <h2 class="section-heading">1. Apertura de la Medida</h2>
                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">A</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Inicio y Formularios</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">Se completa el formulario de apertura en 3 pasos correlativos.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPIapertura.png" alt="Inicio MPI" class="zoomable">
                                <div class="img-caption">Apertura de MPI — Inicio formal de la Medida de Protección Integral. Se establecen los objetivos de trabajo con el grupo familiar para restituir los derechos vulnerados.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIformulariodeapertura.png" alt="Step 1" class="zoomable">
                                <div class="img-caption">Paso 1 — Datos generales.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIformulariodepaerturastep2.png" alt="Step 2" class="zoomable" />
                                <div class="img-caption">Paso 2 — Contexto y objetivos.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIfomulariodeaperturastep3.png" alt="Step 3" class="zoomable" />
                                <div class="img-caption">Paso 3 — Finalización.</div>
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">B</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Aprobación y Vigencia</span>
                                <div class="tl-roles"><span class="role-tag role-director">Director/a</span></div>
                            </div>
                            <p class="tl-body">La medida requiere aprobación jerárquica para entrar en vigencia.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPIaprobaciondeapertura.png" alt="Aprobación" class="zoomable" />
                                <div class="img-caption">Validación por Director/a o JZ.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIaperturaaprobada.png" alt="MPI Vigente" class="zoomable" />
                                <div class="img-caption">Vista de la medida ya aprobada y activa.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 class="section-heading">2. Gestión y Seguimiento</h2>
                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">C</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Plan de Acción y Actividades</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">Manejo de la agenda de intervenciones y cronología.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPIplan de trabajo.png" alt="Plan Trabajo" class="zoomable" />
                                <div class="img-caption">Estrategia de Intervención — Planificación de objetivos y actividades a corto y mediano plazo. Es la hoja de ruta que guiará el trabajo del técnico durante los próximos meses.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIplandeaccionconactividadenprogreso.png" alt="Progreso" class="zoomable" />
                                <div class="img-caption">Seguimiento Dinámico — Vista detallada de las actividades en curso. Permite al técnico monitorear el cumplimiento de los hitos establecidos en el plan.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIactividadagregada.png" alt="Actividad" class="zoomable" />
                                <div class="img-caption">Nueva actividad planificada.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIasignaractividades.png" alt="Asignación" class="zoomable" />
                                <div class="img-caption">Panel de asignación a profesionales.</div>
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">D</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Informes Mensuales</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <p class="tl-body">Control estricto de informes obligatorios de seguimiento.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPIinformesmensuales obligatorios.png" alt="Informes" class="zoomable" />
                                <div class="img-caption">Rendición de Avances — Carga periódica de informes de seguimiento. El sistema alerta automáticamente sobre los vencimientos para garantizar la continuidad de la medida.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIinformeobligatoriocompleto.png" alt="Informe OK" class="zoomable" />
                                <div class="img-caption">Detalle de informe completado.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 class="section-heading">3. Cierre de la Medida</h2>
                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">E</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Solicitud de Cierre</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span><span class="role-tag role-director">Director/a</span></div>
                            </div>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPIcierredelamedida.png" alt="Cierre" class="zoomable" />
                                <div class="img-caption">Formulario de solicitud de baja de medida.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPImodalcierre.png" alt="Confirmación" class="zoomable" />
                                <div class="img-caption">Validación final del equipo.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIcierrecompleto.png" alt="Final" class="zoomable" />
                                <div class="img-caption">Resumen de medida cerrada.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },

        // ── PROCESO MPE ────────────────────────────────
        'proceso-mpe': {
            title: 'Medida Excepcional (MPE)',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 6</span>
                    <h1>Medida de Protección Excepcional (MPE)</h1>
                    <p class="subtitle">Separación temporal o definitiva del entorno familiar para resguardar la integridad del NNyA.</p>
                </div>

                <div class="callout warning">
                    <span class="callout-icon">⚖️</span>
                    <div class="callout-body">
                        <strong>Dictamen Jurídico Obligatorio</strong>
                        <p>La MPE no puede activarse sin el visado legal y el aval de la Jefatura.</p>
                    </div>
                </div>

                <h2 class="section-heading">1. Circuito de Apertura</h2>
                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">1</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Solicitud y Modal de Apertura</span>
                                <div class="tl-roles"><span class="role-tag role-tecnico">Técnico/a</span></div>
                            </div>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPE.png" alt="Acceso MPE" class="zoomable" />
                                <div class="img-caption">Panel de Medida Excepcional — Gestión de situaciones de máxima vulnerabilidad donde se requiere la separación del niño de su entorno nuclear inmediato.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPEetapasdeaperura.png" alt="Etapas" class="zoomable" />
                                <div class="img-caption">Diagrama visual del flujo de apertura MPE.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPEmodaldeapertura1.png" alt="Paso 1" class="zoomable" />
                                <div class="img-caption">Paso 1 — Formulario inicial.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPEmodalapertura2.png" alt="Paso 2" class="zoomable" />
                                <div class="img-caption">Paso 2 — Detalle de situación.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPEmodalapertura3completo.png" alt="Paso 3" class="zoomable" />
                                <div class="img-caption">Paso 3 — Finalización de carga.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPEaprobaciondeaperturaJZ.png" alt="Jefatura" class="zoomable" />
                                <div class="img-caption">Aprobación jerárquica por <span class="role-tag role-jz">JZ</span>.</div>
                            </div>
                            
                        </div>
                    </div>
                </div>

                <h2 class="section-heading">2. Gestión de Aval y Legales</h2>
                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">2</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Nota de Aval (Interna)</span>
                                <div class="tl-roles"><span class="role-tag role-director">Director/a</span></div>
                            </div>
                            <p class="tl-body">Generación de la nota de aval previa a la intervención legal.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPEnotadeaval.png" alt="Aval" class="zoomable" />
                                <div class="img-caption">Generación de Nota de Aval interna.</div>

                        </div>
                        <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPEmodalnotaavalapertura.png" alt="Aval" class="zoomable" />
                                <div class="img-caption">Generación de Nota de Aval interna.</div>

                        </div>
                        </div>
                        <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPEnotadeavaladjunto.png" alt="Aval" class="zoomable" />
                                <div class="img-caption">Generación de Nota de Aval interna.</div>

                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">3</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Intervención de Legales</span>
                                <div class="tl-roles"><span class="role-tag role-legales">Legales</span></div>
                            </div>
                            <p class="tl-body">Carga del dictamen jurídico después del aval de jefatura.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPEinformejuridicoaperura.png" alt="Jurídico" class="zoomable" />
                                <div class="img-caption">Dictamen Jurídico — Intervención obligatoria de Legales para validar la procedencia de la medida excepcional desde el marco normativo vigente.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPEmodalinformejuridico.png" alt="Gestión Legal" class="zoomable" />
                                <div class="img-caption">Modal de carga de documentos legales.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPEinformejuridico3.png" alt="Visado" class="zoomable" />
                                <div class="img-caption">Visado final del área legal.</div>
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">4</div>
                        <div class="tl-content">
                            <div class="tl-header">
                                <span class="tl-title">Ratificación Judicial</span>
                                <div class="tl-roles"><span class="role-tag role-legales">Legales</span><span class="role-tag role-jz">JZ</span></div>
                            </div>
                            <p class="tl-body">Paso final de validación ante el juzgado correspondiente.</p>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPEratificacionapertura.png" alt="Ratificación" class="zoomable" />
                                <div class="img-caption">Ratificación judicial de la medida.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },

        'guia-modulos': {
            title: 'Guía de Módulos',
            html: `
                <div class="page-header">
                    <span class="module-tag">Módulo Pedagógico</span>
                    <h1>Descripción de Módulos</h1>
                    <p class="subtitle">Estructura y propósito de las pantallas principales del sistema SIMD/NNA.</p>
                </div>

                <div class="card">
                    <div class="card-title"><span class="card-icon">📥</span> 1. Mesa de Entrada</div>
                    <p>Es el punto de inicio de la gestión. Aquí se reciben todas las demandas espontáneas o derivadas y se realiza la búsqueda nominal para evitar duplicidad de registros.</p>
                    <ul class="list-bullets">
                        <li>Buscar NNyA por DNI o Nombre</li>
                        <li>Registrar nueva Demanda</li>
                        <li>Documentar Constatación territorial</li>
                        <li>Realizar Evaluación técnica inicial</li>
                    </ul>
                    <div class="callout tip">
                        <strong>💡 Diferencia Clave</strong>
                        <p>Podés registrar la intervención (constatación y evaluación) sin necesidad de crear un legajo. Solo si decidís tomar una medida de protección formal, el sistema te pedirá abrir el legajo del niño/a.</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title" style="color: #0D9488"><span class="card-icon">🛡️</span> 2. Canal A — Protección RUNNA</div>
                    <p>Este flujo está diseñado para las solicitudes de protección que ingresan por fuera del circuito judicial. Permite un seguimiento permanente de la vulneración de derechos detectada.</p>
                    <ul class="list-bullets">
                        <li>Asignación directa a equipos zonales</li>
                        <li>Trazabilidad de la demanda inicial</li>
                        <li>Gestión de la intervención técnica</li>
                        <li>Pase a Legajo en caso de Medida</li>
                    </ul>
                </div>

                <div class="card">
                    <div class="card-title" style="color: #D97706"><span class="card-icon">⚖️</span> 3. Canal B — Oficio Judicial</div>
                    <p>Módulo especializado para la gestión de requerimientos provenientes de juzgados. La estructura está adaptada para responder a tiempos y formalidades judiciales.</p>
                    <ul class="list-bullets">
                        <li>Identificación con tag MPJ - MPE - MPI (celeste)</li>
                        <li>Asignación a equipo y técnico</li>
                        <li>Registro de actividades cumplimentadas</li>
                        <li>Aprobacion y visado de las actividades realizadas por los equipos</li>
                        <li>Envio de respuestas a los juzgados</li>
                    </ul>
                    <div class="callout warning">
                         <strong>⚠️ Atención</strong>
                         <p>Las actividades vinculadas a Oficio Judicial tienen un color de fondo celeste diferenciado para que nunca pierdas de vista la prioridad y el origen de la demanda. La carga del oficio judicial en MPI y MPE solo se utilizar siempre y cuando hay una Medida de este tipo vigente. (los oficios judiciales relacionados a MPI y MPI no abren ni cierran medidas solo pueden crear actividades pendientes en el plan de trabajo.</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title"><span class="card-icon">📁</span> 4. Legajos y Medidas</div>
                    <p>El Legajo representa la historia administrativa del NNyA. En este sistema, el legajo tiene una estructura jerárquica limpia y organizada.</p>
                    
                    <div class="hierarchy-diagram">
                        <div class="h-item h-legajo">LEGAJO (NNyA)</div>
                        <div class="h-arrow">↓</div>
                        <div class="h-item h-medida">MEDIDA (Plan de Intervención)</div>
                        <div class="h-arrow">↓</div>
                        <div class="h-grid">
                            <div class="h-sub"><b>Intervenciones Especiales</b><br>Apertura, Prórroga, Cese</div>
                            <div class="h-sub"><b>Plan de Trabajo</b><br>Actividades por Categoría</div>
                            <div class="h-sub"><b>Informes Mensuales</b><br>Seguimiento Obligatorio</div>
                        </div>
                    </div>

                    <div class="callout info">
                        <strong>📋 Estructura Jerárquica</strong>
                        <p>A diferencia del sistema anterior, ahora las intervenciones especiales (como el Cese) no son una actividad más en la lista, sino que tienen su propio proceso y visualización destacada.</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title"><span class="card-icon">📈</span> 5. Plan de Trabajo e Informes Mensuales</div>
                    <p>Herramientas para la organización técnica del seguimiento. Permiten agrupar intervenciones por temáticas y asegurar reportes periódicos de calidad.</p>
                    <ul class="list-bullets">
                        <li>Creación de categorías temáticas</li>
                        <li>Agrupación de visitas y gestiones</li>
                        <li>Carga de Reporte Mensual obligatorio</li>
                        <li>Visualización de evolución del caso</li>
                    </ul>
                </div>
            `
        },

        'equivalencias': {
            title: 'Equivalencias V vs N',
            html: `
                <div class="page-header">
                    <span class="module-tag">Cambio de Paradigma</span>
                    <h1>Equivalencias: El Antes y el Después</h1>
                    <p class="subtitle">¿Por qué cambió el sistema? Comparativa entre el modelo anterior y la nueva gestión integral SIMD/NNA.</p>
                </div>

                <div class="equiv-grid">
                    <div class="equiv-row">
                        <div class="equiv-label">Punto de ingreso</div>
                        <div class="equiv-card old">
                            <span class="equiv-icon">⚠️ Antes:</span>
                            <strong>Legajo Obligatorio</strong>
                            <p>Para registrar contacto era necesario abrir legajo completo.</p>
                        </div>
                        <div class="equiv-card new">
                            <span class="equiv-icon">✅ Ahora:</span>
                            <strong>Mesa de Entrada</strong>
                            <p>Se registra demanda y evaluación inicial sin abrir legajos innecesarios.</p>
                        </div>
                    </div>

                    <div class="equiv-row">
                        <div class="equiv-label">¿Cuándo se abre Legajo?</div>
                        <div class="equiv-card old">
                            <span class="equiv-icon">⚠️ Antes:</span>
                            <strong>Al inicio</strong>
                            <p>Se abría por defecto ante cada situación, generando registros irrelevantes.</p>
                        </div>
                        <div class="equiv-card new">
                            <span class="equiv-icon">✅ Ahora:</span>
                            <strong>Hay tres opciones:</strong>
                            <p>De manera manual, luego de la evaluación y aprobación de la mesa de entrada, o por un oficio judicial que ordene la apertura de la medida. Estas dos últimas se realizan de manera automática.</p>
                        </div>
                    </div>

                    <div class="equiv-row">
                        <div class="equiv-label">Registro intervenciones dentro de la Medida</div>
                        <div class="equiv-card old">
                            <span class="equiv-icon">⚠️ Antes:</span>
                            <strong>Lista Plana</strong>
                            <p>Todas las acciones se veían en una lista única sin jerarquía ni orden lógico.</p>
                        </div>
                        <div class="equiv-card new">
                            <span class="equiv-icon">✅ Ahora:</span>
                            <strong>Categorizadas</strong>
                            <p>Las intervenciones se agrupan en una card para la apertura y en un Plan de Trabajo (Cese, Prórroga).</p>
                        </div>
                    </div>

                    <div class="equiv-row">
                        <div class="equiv-label">Apertura / Innovacion / Prórroga / Cese</div>
                        <div class="equiv-card old">
                            <span class="equiv-icon">⚠️ Antes:</span>
                            <strong>Actividad común</strong>
                            <p>El cierre no se distinguía visualmente del resto de las visitas.</p>
                        </div>
                        <div class="equiv-card new">
                            <span class="equiv-icon">✅ Ahora:</span>
                            <strong>Bloque Especial</strong>
                            <p>Tienen un proceso propio y se visualizan en tarjetas destacadas.</p>
                        </div>
                    </div>

                    <div class="equiv-row">
                        <div class="equiv-label">Plan de Trabajo</div>
                        <div class="equiv-card old">
                            <span class="equiv-icon">⚠️ Antes:</span>
                            <strong>Inexistente</strong>
                            <p>No había herramienta para planificar objetivos por áreas temáticas.</p>
                        </div>
                        <div class="equiv-card new">
                            <span class="equiv-icon">✅ Ahora:</span>
                            <strong>Eje Organizador</strong>
                            <p>Permite agrupar actividades según objetivos planteados para la protección y fechas de realizacion.</p>
                        </div>
                    </div>

                    <div class="equiv-row">
                        <div class="equiv-label">Informes Mensuales</div>
                        <div class="equiv-card old">
                            <span class="equiv-icon">⚠️ Antes:</span>
                            <strong>Opcionales</strong>
                            <p>No había un registro periódico estandarizado del estado de la medida. Existia  informe 420, No habia  una informacion visual.</p>
                        </div>
                        <div class="equiv-card new">
                            <span class="equiv-icon">✅ Ahora:</span>
                            <strong>Obligatorios</strong>
                            <p>Cada mes se debe cargar un avance, permitiendo visibilidad constante. Es el mismo informe 420.</p>
                        </div>
                    </div>

                    <div class="equiv-row">
                        <div class="equiv-label">Casos sin Medida</div>
                        <div class="equiv-card old">
                            <span class="equiv-icon">⚠️ Antes:</span>
                            <strong>"Limbo"</strong>
                            <p>Se abrían medidas ficticias para poder registrar casos que no prosperaban.</p>
                        </div>
                        <div class="equiv-card new">
                            <span class="equiv-icon">✅ Ahora:</span>
                            <strong>Historial en Mesa</strong>
                            <p>Todos los casos termimen o no en medida quedan registrados en la mesa de entrada pudiendo ademas vincular las demandas entre si.</p>
                        </div>
                    </div>
                </div>

                <div class="summary-box">
                    <h3>🚀 Los 3 cambios clave para recordar:</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-num">1</div>
                            <p><strong>De "lista" a "plan"</strong>: Ya no cargamos actividades sueltas, cargamos un seguimiento planificado.</p>
                        </div>
                        <div class="summary-item">
                            <div class="summary-num">2</div>
                            <p><strong>Legajo Limpio</strong>: Solo abrimos expediente cuando hay una medida que lo justifique.</p>
                        </div>
                        <div class="summary-item">
                            <div class="summary-num">3</div>
                            <p><strong>Trazabilidad Única</strong>: El Canal B (Judicial) está integrado pero visualmente separado.</p>
                        </div>
                    </div>
                </div>
            `
        },

        'plan-trabajo': {
            title: 'Plan de Trabajo',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 7</span>
                    <h1>Plan de Trabajo Transversal</h1>
                    <p class="subtitle">Gestión de la agenda, actividades y cronologías compartidas entre MPI y MPE.</p>
                </div>

                <div class="callout technical">
                    <span class="callout-icon">⚙️</span>
                    <div class="callout-body">
                        <strong>Estratégico</strong>
                        <p>El Plan de Trabajo es el núcleo operativo de RUNNA. Permite coordinar acciones con salud, educación y otras áreas.</p>
                    </div>
                </div>

                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">1</div>
                        <div class="tl-content">
                            <span class="tl-title">Estructura del Plan</span>
                            <div class="img-wrap" style="margin-top:12px;">
                                <img src="assets/MPIplan de trabajo.png" alt="Plan de Trabajo" class="zoomable" />
                                <div class="img-caption">Vista Estratégica — El Plan de Trabajo consolida objetivos y plazos, permitiendo una visión integral de la situación del NNyA.</div>
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">2</div>
                        <div class="tl-content">
                            <span class="tl-title">Carga de Actividades</span>
                            <div class="img-wrap">
                                <img src="assets/MPIagregar actividad.png" alt="Agregar Actividad" class="zoomable" />
                                <div class="img-caption">Planificación Táctica — Formulario para detallar cada intervención (visitas, oficios, derivaciones) que forma parte del plan de acción.</div>
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">3</div>
                        <div class="tl-content">
                            <span class="tl-title">Asignación y Seguimiento</span>
                            <div class="img-wrap">
                                <img src="assets/MPIasignaractividades.png" alt="Asignación" class="zoomable" />
                                <div class="img-caption">Panel para delegar tareas a miembros del equipo.</div>
                            </div>
                            <div class="img-wrap">
                                <img src="assets/MPIhistorialdeactividad.png" alt="Historial" class="zoomable" />
                                <div class="img-caption">Cronología completa de intervenciones.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },

        // ── PROCESO MPJ ────────────────────────────────
        'proceso-mpj': {
            title: 'Oficio Judicial (MPJ)',
            html: `
                <div class="page-header">
                    <span class="module-tag">MÓDULO 8</span>
                    <h1>Oficio Judicial / MPJ</h1>
                    <p class="subtitle">Gestión de causas judiciales y cumplimiento de medidas solicitadas por el juzgado.</p>
                </div>

                <div class="callout technical">
                    <span class="callout-icon">⚖️</span>
                    <div class="callout-body">
                        <div style="display:flex; gap:6px; margin-bottom:8px;">
                            <span class="role-tag role-mesa">Mesa</span>
                            <span class="role-tag role-director">Director</span>
                            <span class="role-tag role-tecnico">Técnico</span>
                            <span class="role-tag role-legales">Legales</span>
                            <span class="role-tag role-jz">JZ</span>
                        </div>
                        <strong>Circuito Judicial</strong>
                        <p>Este flujo se activa cuando la demanda ingresa por Oficio Judicial (Canal B). Involucra la coordinación de todos los roles del sistema.</p>
                    </div>
                </div>

                <h2 class="section-heading" id="mpj-registro">
                    <span class="role-tag role-mesa">Mesa de Entrada</span>
                    0. Registro de la Demanda
                </h2>
                <div class="img-wrap">
                    <img src="assets/nuevademandaoficiojudicial.png" alt="Selección Objetivo" class="zoomable" />
                    <div class="img-caption">Filtro 'Carga de Oficios' — Al seleccionar este canal, el sistema habilita el formulario técnico especializado para demandas provenientes del Poder Judicial.</div>
                </div>
                <div class="img-wrap">
                    <img src="assets/mpjformulariodemanda.png" alt="Formulario Judicial" class="zoomable" />
                    <div class="img-caption">Registro del Oficio — Carga de los datos del expediente, juzgado de origen, carátula y los plazos judiciales impuestos por la orden.</div>
                </div>
                <div class="img-wrap">
                    <img src="assets/confirmacion de creacion de nuevademanda.png" alt="Confirmación" class="zoomable" />
                    <div class="img-caption">Admisión Exitosa — Se genera el número de legajo MPJ. El sistema dispara automáticamente la notificación a la bandeja de entrada del Director.</div>
                </div>

                <h2 class="section-heading" id="mpj-asignacion-equipo">
                    <span class="role-tag role-director">Director/a</span>
                    1. Asignación a Equipo
                </h2>
                <div class="img-wrap">
                    <img src="assets/mpjbandejadeactividadesasignadasaldirector.png" alt="Bandeja Director" class="zoomable" />
                    <div class="img-caption">Control Jerárquico — El Director supervisa las nuevas causas judiciales pendientes de asignación técnica para garantizar el cumplimiento de plazos.</div>
                </div>
                <div class="img-wrap">
                    <img src="assets/modalasignaractivdadesmasivo.png" alt="Asignación Masiva" class="zoomable" />
                    <div class="img-caption">Trámite Masivo — Herramienta para derivar múltiples oficios a un mismo equipo o profesional de manera ágil y centralizada.</div>
                </div>

                <h2 class="section-heading" id="mpj-asignacion-tecnico">
                    <span class="role-tag role-director">Director/a</span>
                    2. Asignación a Técnico
                </h2>
                <div class="img-wrap">
                    <img src="assets/mpjdirectorasignaactividadesatecnico.png" alt="Derivación a Técnico" class="zoomable" />
                    <div class="img-caption">Asignación Directa — Último paso de la derivación donde se elige al técnico individual que será responsable de responder al juzgado.</div>
                </div>

                <h2 class="section-heading" id="mpj-tecnico-actividades">
                    <span class="role-tag role-tecnico">Técnico/a</span>
                    3. Intervención Técnica
                </h2>
                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot">1</div>
                        <div class="tl-content">
                            <h3>Gestión de Actividades</h3>
                            <p>El técnico accede a su bandeja y realiza el **Acuse de Recibo** para tomar conocimiento de la demanda judicial.</p>
                            <div class="img-wrap">
                                <img src="assets/mpjbandejaactividadesacompletarusuariotecnico.png" alt="Bandeja Técnico" class="zoomable" />
                            </div>
                            <div class="img-wrap">
                                <img src="assets/Mpjusuariotecnicoconfimaacusederecibo.png" alt="Acuse Recibo" class="zoomable" />
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">2</div>
                        <div class="tl-content">
                            <h3>Cambio de Estado y Proceso</h3>
                            <p>Se cambia el estado a **'En Progreso'** mientras se trabaja en la causa.</p>
                            <div class="img-wrap">
                                <img src="assets/mpjusuariotecnicocambiadeestado.png" alt="Cambio Estado" class="zoomable" />
                            </div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot">3</div>
                        <div class="tl-content">
                            <h3>Carga de Informe y Cierre</h3>
                            <p>Se completa la actividad **adjuntando el informe requerido** (PDF/Documento) y pasando el estado a **'Completada'**.</p>
                            <div class="img-wrap">
                                <img src="assets/mpjcambiaactividada completo.png" alt="Adjuntar y Finalizar" class="zoomable" />
                                <div class="img-caption">Es vital adjuntar el respaldo técnico antes de finalizar para que el Director pueda visarlo.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 class="section-heading" id="mpj-director-aprobacion">
                    <span class="role-tag role-jz">Jefatura de Zona</span>
                    4. Visado Jefe Zonal (JZ)
                </h2>
                <div class="img-wrap">
                    <img src="assets/mpjbandejaactividadesdirectorpendientevisadoJZ.png" alt="Bandeja JZ" class="zoomable" />
                    <div class="img-caption">El Director (JZ) visualiza en su bandeja las tareas marcadas como 'Pendiente Visado JZ'.</div>
                </div>
                <div class="img-wrap">
                    <img src="assets/mpjmodaldevisadojz.png" alt="Modal Visado JZ" class="zoomable" />
                    <div class="img-caption">Visado de Jefatura — El Jefe Zonal audita técnica y formalmente la respuesta elaborada antes de autorizar su remisión al equipo legal.</div>
                </div>

                <h2 class="section-heading" id="mpj-visado-legal">
                    <span class="role-tag role-legales">Legales</span>
                    5. Visado de Legales
                </h2>
                <div class="img-wrap">
                    <img src="assets/mpjbandejaactividadespendientevisadolegal.png" alt="Bandeja Legales" class="zoomable" />
                    <div class="img-caption">Bandeja Legal — Recepción de informes técnicos ya supervisados por JZ, pendientes de la última validación de forma y fondo legal.</div>
                </div>
                <div class="img-wrap">
                    <img src="assets/mpjvisaractlegales.png" alt="Proceso Visado Legal" class="zoomable" />
                    <div class="img-caption">Validación Final — El abogado revisa la consistencia jurídica y otorga el visado definitivo para dar por cumplimentado el oficio.</div>
                </div>
                <div class="img-wrap">
                    <img src="assets/mpjactividadvisada.png" alt="Ciclo Cerrado" class="zoomable" />
                    <div class="img-caption">**Visado Aprobado**: Con esta acción, el ciclo del Oficio Judicial (MPJ) queda oficialmente cerrado y registrado.</div>
                </div>
            `
        }

    };

    // ─── Init ──────────────────────────────────────────
    updateProgress();
    const initialSection = location.hash.replace('#', '') || 'intro';
    loadSection(initialSection);

});
