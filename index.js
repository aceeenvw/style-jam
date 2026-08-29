// Style Jam: create image-prompt variants from editable fields and saved styles.

import { promptManager } from '/scripts/openai.js';
import { saveSettings } from '/script.js';

const MODULE = 'style-jam';
const TAG = 'SJM';

const warn = (step, err) => console.warn(`[${TAG}] ${step}`, err);

function ctx() {
    return globalThis.SillyTavern?.getContext?.() || null;
}

const I18N = {
    en: {
        title: 'Style Jam',
        openTitle: 'Style Jam — create image-prompt variants',
        intro: 'Copy an image prompt, edit the fields you choose, and activate the new variant.',
        tip: 'Style Jam is not limited to image generation. Set a tag for any prompt to copy it and edit the copy faster.',
        base: 'Base prompt',
        noBase: 'No prompts starting with {tag} were found in the current preset.',
        fields: 'Editable fields',
        markHint: 'Select text below, then click "Create field".',
        makeField: 'Create field',
        preview: 'Base prompt content',
        expand: 'Expand the editor',
        previewNote: 'This preview is read-only.',
        noFields: 'No fields yet. Select the text you want to edit, such as a style suffix or negative prompt.',
        confirmRemoveField: 'Delete field "{name}"?',
        rename: 'Rename',
        remove: 'Delete',
        selectAll: 'Select all',
        clearField: 'Clear',
        styles: 'Style library',
        applyStyle: 'Apply',
        saveStyle: 'Save style',
        noStyles: 'No saved styles yet.',
        forge: 'Create variant',
        cancel: 'Close',
        askName: 'New prompt name',
        askStyleName: 'Style name',
        askFieldName: 'Field name',
        askRename: 'New field name',
        needSelection: 'Select text in the preview first.',
        selNotFound: 'The selected text was not found in the base prompt.',
        created: 'Variant created and activated.',
        overwrite: 'A prompt named "{name}" already exists. Overwrite it?',
        sameAsBase: 'The variant name must differ from the base prompt name.',
        nameInUse: 'Another prompt already uses this name.',
        duplicateField: 'Field names must be unique for this base prompt.',
        overlapField: 'This selection overlaps an existing field.',
        protectedTag: 'The prompt tag cannot be part of an editable field.',
        fieldStale: 'Field not found in the base prompt. Select its text again.',
        staleFields: 'Resolve overlapping or missing fields before creating a variant.',
        saveFailed: 'The variant could not be saved.',
        notOai: 'Select a Chat Completion preset to use Style Jam.',
        applied: 'Style applied.',
        confirmRemoveStyle: 'Delete style "{name}"?',
        settingsIntro: 'Choose the tag Style Jam uses to find image prompts.',
        tagLabel: 'Prompt tag',
        tagHint: 'Enter the tag name without angle brackets. Style Jam finds prompts that start with this tag.',
        tagPreview: 'Prompts starting with {tag}',
        tagMatches: 'Matches in the current preset: {n}',
        reset: 'Reset',
    },
    ru: {
        title: 'Style Jam',
        openTitle: 'Style Jam — варианты промптов для изображений',
        intro: 'Скопируйте промпт для изображения, измените выбранные поля и активируйте новый вариант.',
        tip: 'Style Jam подходит не только для промптов генерации изображений. Укажите тег любого промпта, чтобы быстро создавать и редактировать его копии.',
        base: 'Базовый промпт',
        noBase: 'В текущем пресете нет промптов, начинающихся с {tag}.',
        fields: 'Редактируемые поля',
        markHint: 'Выделите текст ниже и нажмите «Создать поле».',
        makeField: 'Создать поле',
        preview: 'Содержимое базового промпта',
        expand: 'Развернуть редактор',
        previewNote: 'Предпросмотр доступен только для чтения.',
        noFields: 'Полей пока нет. Выделите текст, который хотите редактировать, например суффикс стиля или негативный промпт.',
        confirmRemoveField: 'Удалить поле «{name}»?',
        rename: 'Переименовать',
        remove: 'Удалить',
        selectAll: 'Выделить всё',
        clearField: 'Очистить',
        styles: 'Библиотека стилей',
        applyStyle: 'Применить',
        saveStyle: 'Сохранить стиль',
        noStyles: 'Сохранённых стилей пока нет.',
        forge: 'Создать вариант',
        cancel: 'Закрыть',
        askName: 'Название нового промпта',
        askStyleName: 'Название стиля',
        askFieldName: 'Название поля',
        askRename: 'Новое название поля',
        needSelection: 'Сначала выделите текст в предпросмотре.',
        selNotFound: 'Выбранный текст не найден в базовом промпте.',
        created: 'Вариант создан и активирован.',
        overwrite: 'Промпт с именем «{name}» уже есть. Перезаписать?',
        sameAsBase: 'Название варианта должно отличаться от названия базового промпта.',
        nameInUse: 'Это название уже используется другим промптом.',
        duplicateField: 'Названия полей базового промпта не должны повторяться.',
        overlapField: 'Выделенный текст пересекается с существующим полем.',
        protectedTag: 'Тег промпта нельзя включать в редактируемое поле.',
        fieldStale: 'Поле не найдено в базовом промпте. Выделите его текст заново.',
        staleFields: 'Перед созданием варианта исправьте пересекающиеся или ненайденные поля.',
        saveFailed: 'Не удалось сохранить вариант.',
        notOai: 'Выберите пресет Chat Completion, чтобы использовать Style Jam.',
        applied: 'Стиль применён.',
        confirmRemoveStyle: 'Удалить стиль «{name}»?',
        settingsIntro: 'Выберите тег, по которому Style Jam находит промпты для изображений.',
        tagLabel: 'Тег промпта',
        tagHint: 'Введите название тега без угловых скобок. Style Jam находит промпты, начинающиеся с этого тега.',
        tagPreview: 'Промпты, начинающиеся с {tag}',
        tagMatches: 'Совпадений в текущем пресете: {n}',
        reset: 'Сбросить',
    },
};

function lang() {
    const candidates = [];
    try {
        const c = ctx();
        candidates.push(c?.getCurrentLocale?.(), c?.powerUserSettings?.locale, document.documentElement.lang);
        if (typeof navigator !== 'undefined') candidates.push(...(navigator.languages || []), navigator.language);
    } catch {}
    for (const value of candidates) {
        const code = String(value || '').trim().toLowerCase().split(/[-_]/)[0];
        if (I18N[code]) return code;
    }
    return 'en';
}

function t(key, vars) {
    const dictionary = I18N[lang()] || I18N.en;
    let s = dictionary[key] ?? I18N.en[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, vars[k]);
    return s;
}

// Stable IDs and settings namespace.
const NS_DELTA = [2, 2, 0, 9, 8, 1];
function nsBasis() {
    let acc = 0, prev = 0x60 + 1;
    acc = (acc * 31 + prev) >>> 0;
    for (let i = 0; i < NS_DELTA.length; i++) {
        prev += NS_DELTA[i];
        acc = (acc * 31 + prev) >>> 0;
    }
    return acc || 0x811c9dc5;
}
function fnv1a(str) {
    let h = nsBasis();
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
}
const NS = 'aev-' + fnv1a(MODULE).slice(0, 6);

function makeId(seed) {
    return NS + '-' + fnv1a(seed + ':' + Date.now() + ':' + Math.random()).slice(0, 8);
}

const DEFAULT_TAG = 'image_gen';

function store() {
    const c = ctx();
    if (!c) return null;
    const root = c.extensionSettings;
    if (!root || typeof root !== 'object') return null;
    if (!root[NS] || typeof root[NS] !== 'object' || Array.isArray(root[NS])) {
        root[NS] = { fields: {}, styles: [], tag: DEFAULT_TAG };
    }
    if (!root[NS].fields || typeof root[NS].fields !== 'object' || Array.isArray(root[NS].fields)) {
        root[NS].fields = {};
    }
    if (!Array.isArray(root[NS].styles)) root[NS].styles = [];
    if (typeof root[NS].tag !== 'string') root[NS].tag = DEFAULT_TAG;
    return root[NS];
}

function persist() {
    try { ctx()?.saveSettingsDebounced?.(); } catch (e) { warn('persist', e); }
}

// Normalize the configured tag by removing delimiters and unsupported characters.
function normalizeTag(raw) {
    const clean = String(raw || '')
        .replace(/[<>/]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9_.:-]/g, '');
    return clean || DEFAULT_TAG;
}

function tag() {
    return normalizeTag(store()?.tag || DEFAULT_TAG);
}

function openTag() {
    return '<' + tag() + '>';
}

function presetFieldKey(presetName) {
    const name = presetName || ctx()?.chatCompletionSettings?.preset_settings_openai || 'Default';
    return 'preset-' + fnv1a(String(name));
}

function presetFields() {
    const s = store();
    if (!s) return {};
    const key = presetFieldKey();
    if (!s.fields[key] || typeof s.fields[key] !== 'object' || Array.isArray(s.fields[key])) {
        s.fields[key] = {};
    }

    let migrated = false;
    for (const [promptId, fields] of Object.entries(s.fields)) {
        if (!Array.isArray(fields)) continue;
        if (!Array.isArray(s.fields[key][promptId])) s.fields[key][promptId] = fields;
        delete s.fields[promptId];
        migrated = true;
    }
    if (migrated) persist();
    return s.fields[key];
}

function movePresetFields(event) {
    if (event?.apiId !== 'openai' || !event.oldName || !event.newName) return;
    const fields = store()?.fields;
    if (!fields) return;
    const oldKey = presetFieldKey(event.oldName);
    const newKey = presetFieldKey(event.newName);
    if (!fields[oldKey]) return;
    fields[newKey] = fields[oldKey];
    delete fields[oldKey];
    persist();
}

function isOai() {
    return ctx()?.mainApi === 'openai' && !!promptManager;
}

function allPrompts() {
    return ctx()?.chatCompletionSettings?.prompts || [];
}

function imageGenPrompts() {
    const open = openTag();
    return allPrompts().filter(p =>
        typeof p?.content === 'string'
        && p.content.trimStart().startsWith(open)
        && p.marker !== true
        && p.system_prompt !== true);
}

function promptById(id) {
    return allPrompts().find(p => p.identifier === id) || null;
}

function orderList() {
    const c = ctx();
    const dummy = promptManager?.activeCharacter?.id ?? 100001;
    return (c?.chatCompletionSettings?.prompt_order || [])
        .find(o => String(o.character_id) === String(dummy))?.order || [];
}

function orderEntry(id) {
    return orderList().find(e => e.identifier === id) || null;
}

function isEnabled(id) {
    return !!orderEntry(id)?.enabled;
}

// Return the enabled prompt matching the configured tag.
function activeImageGenId() {
    const igIds = new Set(imageGenPrompts().map(p => p.identifier));
    const entry = orderList().find(e => igIds.has(e.identifier) && e.enabled);
    return entry?.identifier || null;
}

const ANCHOR = 30;

function makeField(name, content, selStart, selEnd) {
    return {
        name,
        text: content.slice(selStart, selEnd),
        before: content.slice(Math.max(0, selStart - ANCHOR), selStart),
        after: content.slice(selEnd, Math.min(content.length, selEnd + ANCHOR)),
    };
}

function occurrences(content, text) {
    if (!text) return [];
    const found = [];
    for (let at = content.indexOf(text); at >= 0; at = content.indexOf(text, at + 1)) found.push(at);
    return found;
}

function resolveField(field, content) {
    const { text, before, after } = field;
    if (typeof text !== 'string') return null;

    if (before || after) {
        const combo = before + text + after;
        const matches = occurrences(content, combo);
        if (matches.length === 1) {
            const start = matches[0] + before.length;
            return { start, end: start + text.length };
        }
    }

    if (text) {
        const matches = occurrences(content, text);
        if (matches.length === 1) {
            return { start: matches[0], end: matches[0] + text.length };
        }
        const anchored = matches.filter((at) => {
            const beforeMatches = !before || content.slice(at - before.length, at) === before;
            const afterMatches = !after || content.slice(at + text.length, at + text.length + after.length) === after;
            return beforeMatches && afterMatches;
        });
        if (anchored.length === 1) {
            return { start: anchored[0], end: anchored[0] + text.length };
        }
    }

    if (before && after) {
        const gaps = occurrences(content, before).flatMap((b) => {
            const gapStart = b + before.length;
            const a = content.indexOf(after, gapStart);
            const nextBefore = content.indexOf(before, gapStart);
            return a >= 0 && (nextBefore < 0 || a < nextBefore) ? [{ start: gapStart, end: a }] : [];
        });
        if (gaps.length === 1) return gaps[0];
    }
    return null;
}

function resolveFields(content, fields) {
    const spans = [];
    fields.forEach((f) => {
        if (!f._k) f._k = makeId('f');
        const span = resolveField(f, content);
        if (span) spans.push({ ...span, field: f });
    });
    if (spans.length !== fields.length) return null;
    const ordered = [...spans].sort((a, b) => a.start - b.start);
    if (ordered.some((span, i) => i > 0 && span.start < ordered[i - 1].end)) return null;
    const tagStart = content.length - content.trimStart().length;
    const tagEnd = tagStart + openTag().length;
    if (ordered.some(span => span.start < tagEnd && span.end > tagStart)) return null;
    return ordered;
}

function applyFieldValues(content, fields, values) {
    const spans = resolveFields(content, fields);
    if (!spans) return null;
    const replacements = spans
        .filter(({ field }) => Object.hasOwn(values, field._k))
        .map(span => ({ ...span, value: values[span.field._k] }));
    replacements.sort((a, b) => b.start - a.start);
    let out = content;
    for (const s of replacements) out = out.slice(0, s.start) + s.value + out.slice(s.end);
    return out;
}

function matchingNamedPrompt(name, excludeId) {
    return imageGenPrompts().find(p => p.name === name && p.identifier !== excludeId) || null;
}

// Create and activate a variant immediately after its base prompt.
async function createVariant(baseId, values, newName) {
    const base = promptById(baseId);
    if (!base) return null;

    const content = applyFieldValues(base.content, presetFields()[baseId] || [], values);
    if (content == null) return null;
    const existing = matchingNamedPrompt(newName, baseId);

    if (!orderEntry(baseId)) {
        promptManager.appendPrompt(promptManager.getPromptById(baseId), promptManager.activeCharacter);
    }

    if (existing) {
        const replacement = structuredClone(base);
        Object.assign(replacement, { identifier: existing.identifier, name: newName, content });
        delete replacement.enabled;
        for (const key of Object.keys(existing)) delete existing[key];
        Object.assign(existing, replacement);
        if (!orderEntry(existing.identifier)) {
            promptManager.appendPrompt(promptManager.getPromptById(existing.identifier), promptManager.activeCharacter);
        }
        reorderAfter(baseId, existing.identifier);
        finalizeToggle(existing.identifier);
        await save();
        return existing.identifier;
    }

    const id = makeId('prompt');
    const def = structuredClone(base);
    Object.assign(def, { identifier: id, name: newName, content });
    delete def.enabled;

    promptManager.addPrompt(def, id);
    promptManager.appendPrompt(promptManager.getPromptById(id), promptManager.activeCharacter);
    reorderAfter(baseId, id);
    finalizeToggle(id);
    await save();
    return id;
}

function reorderAfter(afterId, id) {
    const order = orderList();
    const from = order.findIndex(e => e.identifier === id);
    if (from < 0) return;
    const [entry] = order.splice(from, 1);
    const at = order.findIndex(e => e.identifier === afterId);
    order.splice(at < 0 ? order.length : at + 1, 0, entry);
}

// Activate the selected prompt and deactivate other prompts with the configured tag.
function finalizeToggle(id) {
    const igIds = new Set(imageGenPrompts().map(p => p.identifier));
    igIds.add(id);
    for (const e of orderList()) {
        if (igIds.has(e.identifier)) e.enabled = (e.identifier === id);
    }
}

async function save() {
    const c = ctx();
    const event = c?.eventTypes?.SETTINGS_UPDATED || c?.event_types?.SETTINGS_UPDATED;
    if (!c?.eventSource || !event) throw new Error('Settings service is unavailable.');
    promptManager.render(false);
    let saved = false;
    const onSaved = () => { saved = true; };
    c.eventSource.on(event, onSaved);
    let timeout;
    try {
        await Promise.race([
            saveSettings(),
            new Promise((_, reject) => {
                timeout = setTimeout(() => reject(new Error('Settings save timed out.')), 15000);
            }),
        ]);
        if (!saved) throw new Error('Settings save failed.');
    } finally {
        clearTimeout(timeout);
        c.eventSource.removeListener(event, onSaved);
    }
}

function styles() {
    return store()?.styles || [];
}

function saveStyleFromValues(name, fields, values) {
    const map = Object.create(null);
    fields.forEach((f) => { if (f._k && Object.hasOwn(values, f._k)) map[f.name] = values[f._k]; });
    const st = { id: makeId('style'), name, values: map };
    styles().push(st);
    persist();
    return st;
}

function valuesFromStyle(style, fields) {
    const out = {};
    fields.forEach((f) => {
        if (f._k && style.values && Object.hasOwn(style.values, f.name)) out[f._k] = style.values[f.name];
    });
    return out;
}

function removeStyle(id) {
    const arr = styles();
    const i = arr.findIndex(s => s.id === id);
    if (i >= 0) { arr.splice(i, 1); persist(); }
}

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}

function clickOnKey(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.click();
}

// Text button with a leading Font Awesome icon.
function iconBtn(cls, icon, text) {
    const b = el('button', 'menu_button ' + cls);
    b.type = 'button';
    b.appendChild(el('i', icon));
    b.appendChild(el('span', null, text));
    return b;
}

// Centered action button with decorative glyphs.
function pillBtn(cls, text) {
    const b = el('button', 'menu_button sjm-pill sjm-pill-glyph ' + cls);
    b.type = 'button';
    b.appendChild(el('span', 'sjm-glyph', '✦'));
    b.appendChild(el('span', 'sjm-pill-label', text));
    b.appendChild(el('span', 'sjm-glyph', '✦'));
    return b;
}

// Icon-only button with title and aria-label text.
function squareBtn(cls, icon, label) {
    const b = el('button', 'menu_button sjm-icon-btn ' + cls);
    b.type = 'button';
    b.appendChild(el('i', icon));
    b.title = label;
    b.setAttribute('aria-label', label);
    return b;
}

// Configure SillyTavern's delegated editor expansion for a textarea.
function maximizeIcon(forId) {
    const i = el('i', 'editor_maximize fa-solid fa-maximize right_menu_button sjm-max');
    i.dataset.for = forId;
    i.dataset.tab = 'true';
    i.title = t('expand');
    i.setAttribute('aria-label', t('expand'));
    i.setAttribute('role', 'button');
    i.setAttribute('tabindex', '0');
    i.addEventListener('keydown', clickOnKey);
    return i;
}

async function prompt(title, def = '') {
    const c = ctx();
    try {
        const v = await c.Popup.show.input(title, null, def);
        return v == null ? null : String(v);
    } catch (e) { warn('prompt', e); return null; }
}

async function confirm(text) {
    const c = ctx();
    try {
        const body = el('div', 'sjm-confirm', text);
        const r = await c.callGenericPopup(body, c.POPUP_TYPE.CONFIRM);
        return r === c.POPUP_RESULT.AFFIRMATIVE || r === true;
    } catch (e) { warn('confirm', e); return false; }
}

function toast(msg, type = 'success') {
    try { globalThis.toastr?.[type]?.(msg, t('title')); } catch {}
}

function buildUI() {
    const root = el('div', 'sjm-root');
    const tip = el('blockquote', 'sjm-tip');
    const tipIcon = el('i', 'fa-solid fa-lightbulb');
    tipIcon.setAttribute('aria-hidden', 'true');
    tip.appendChild(tipIcon);
    tip.appendChild(el('span', null, t('tip')));
    root.appendChild(tip);

    const igs = imageGenPrompts();
    if (!igs.length) {
        root.appendChild(el('div', 'sjm-empty', t('noBase', { tag: openTag() })));
        return { root };
    }

    // Prefer the active matching prompt; otherwise use the first match.
    let baseId = activeImageGenId() || igs[0].identifier;
    const values = {};
    let busy = false;

    async function guarded(button, action) {
        if (busy) return;
        busy = true;
        button.disabled = true;
        try {
            await action();
        } finally {
            busy = false;
            button.disabled = false;
        }
    }

    root.appendChild(el('p', 'sjm-hint sjm-intro', t('intro')));

    const baseRow = el('div', 'sjm-row sjm-base');
    const baseSelectId = NS + '-base';
    const baseLabel = el('label', 'sjm-label', t('base'));
    baseLabel.htmlFor = baseSelectId;
    baseRow.appendChild(baseLabel);
    const sel = el('select', 'text_pole sjm-select');
    sel.id = baseSelectId;
    igs.forEach(p => {
        const o = el('option', null, p.name + (isEnabled(p.identifier) ? '  •' : ''));
        o.value = p.identifier;
        if (p.identifier === baseId) o.selected = true;
        sel.appendChild(o);
    });
    baseRow.appendChild(sel);
    root.appendChild(baseRow);

    const previewWrap = el('div', 'sjm-block');
    const previewId = NS + '-preview';
    const previewHead = el('label', 'sjm-block-head', t('preview'));
    previewHead.htmlFor = previewId;
    previewWrap.appendChild(previewHead);
    const preview = el('textarea', 'text_pole monospace sjm-preview');
    preview.id = previewId;
    preview.readOnly = true;
    previewWrap.appendChild(preview);
    const markBtn = pillBtn('sjm-mark', t('makeField'));
    previewWrap.appendChild(el('div', 'sjm-hint', t('markHint')));
    previewWrap.appendChild(el('div', 'sjm-hint sjm-note', t('previewNote')));
    previewWrap.appendChild(markBtn);
    root.appendChild(previewWrap);

    const fieldsBlock = el('div', 'sjm-block');
    const fieldsHead = el('div', 'sjm-block-head', t('fields'));
    const fieldsCount = el('span', 'sjm-count');
    fieldsHead.appendChild(fieldsCount);
    fieldsBlock.appendChild(fieldsHead);
    const fieldsList = el('div', 'sjm-fields');
    fieldsBlock.appendChild(fieldsList);
    root.appendChild(fieldsBlock);

    const stylesBlock = el('div', 'sjm-block');
    const stylesHead = el('div', 'sjm-block-head', t('styles'));
    const stylesCount = el('span', 'sjm-count');
    stylesHead.appendChild(stylesCount);
    stylesBlock.appendChild(stylesHead);
    const stylesList = el('div', 'sjm-styles');
    stylesBlock.appendChild(stylesList);
    const saveStyleBtn = iconBtn('sjm-add-chip', 'fa-solid fa-bookmark', t('saveStyle'));
    root.appendChild(stylesBlock);

    const footer = el('div', 'sjm-row sjm-footer');
    const forgeBtn = pillBtn('sjm-forge sjm-pill-strong', t('forge'));
    footer.appendChild(forgeBtn);
    root.appendChild(footer);

    function baseFields() {
        const fields = presetFields();
        if (!Array.isArray(fields[baseId])) fields[baseId] = [];
        return fields[baseId];
    }

    function hasDuplicateFieldNames(fields) {
        const names = fields.map(field => field.name);
        return new Set(names).size !== names.length;
    }

    function renderPreview() {
        preview.value = promptById(baseId)?.content || '';
    }

    function renderFields() {
        fieldsList.textContent = '';
        const fields = baseFields();
        fieldsCount.textContent = fields.length ? String(fields.length) : '';
        if (!fields.length) {
            fieldsList.appendChild(el('div', 'sjm-hint', t('noFields')));
            return;
        }
        let assignedKeys = false;
        fields.forEach((f) => {
            if (!f._k) {
                f._k = makeId('f');
                assignedKeys = true;
            }
            const content = promptById(baseId)?.content || '';
            const span = resolveField(f, content);
            if (!Object.hasOwn(values, f._k)) values[f._k] = span ? content.slice(span.start, span.end) : (f.text || '');

            const fieldTaId = NS + '-f-' + f._k;
            const box = el('div', 'sjm-field');
            const head = el('div', 'sjm-field-head');
            const fieldLabel = el('label', 'sjm-field-name', f.name);
            fieldLabel.htmlFor = fieldTaId;
            head.appendChild(fieldLabel);
            if (!span) head.appendChild(el('span', 'sjm-stale', '⚠ ' + t('fieldStale')));
            head.appendChild(maximizeIcon(fieldTaId));
            const selBtn = squareBtn('', 'fa-solid fa-object-group', t('selectAll'));
            const clrBtn = squareBtn('sjm-danger', 'fa-solid fa-eraser', t('clearField'));
            const ren = squareBtn('', 'fa-solid fa-pen', t('rename'));
            const del = squareBtn('sjm-danger', 'fa-solid fa-trash-can', t('remove'));
            head.appendChild(selBtn);
            head.appendChild(clrBtn);
            head.appendChild(el('span', 'sjm-head-sep'));
            head.appendChild(ren);
            head.appendChild(del);
            box.appendChild(head);

            const ta = el('textarea', 'text_pole monospace sjm-field-val');
            ta.id = fieldTaId;
            ta.value = values[f._k];
            ta.rows = Math.min(6, Math.max(2, ta.value.split('\n').length));
            ta.addEventListener('input', () => { values[f._k] = ta.value; });
            box.appendChild(ta);

            selBtn.addEventListener('click', () => { ta.focus(); ta.select(); });
            clrBtn.addEventListener('click', () => {
                ta.value = '';
                values[f._k] = '';
                ta.focus();
            });

            ren.addEventListener('click', () => guarded(ren, async () => {
                const nn = (await prompt(t('askRename'), f.name))?.trim();
                if (!nn || nn === f.name) return;
                if (fields.some(other => other !== f && other.name === nn)) {
                    toast(t('duplicateField'), 'warning');
                    return;
                }
                f.name = nn;
                persist();
                renderFields();
            }));
            del.addEventListener('click', () => guarded(del, async () => {
                if (!(await confirm(t('confirmRemoveField', { name: f.name })))) return;
                const i = fields.indexOf(f);
                if (i >= 0) fields.splice(i, 1);
                delete values[f._k];
                persist();
                renderFields();
            }));

            fieldsList.appendChild(box);
        });
        if (assignedKeys) persist();
    }

    function renderStyles() {
        stylesList.textContent = '';
        const arr = styles();
        stylesCount.textContent = arr.length ? String(arr.length) : '';
        arr.forEach(st => {
            const chip = el('div', 'sjm-style');
            chip.appendChild(el('span', 'sjm-style-dot'));
            chip.appendChild(el('span', 'sjm-style-name', st.name));
            const apply = el('button', 'menu_button sjm-xs sjm-chip-apply', t('applyStyle'));
            apply.type = 'button';
            const del = squareBtn('sjm-chip-del sjm-danger', 'fa-solid fa-xmark', t('remove') + ': ' + st.name);
            apply.setAttribute('aria-label', t('applyStyle') + ': ' + st.name);
            chip.appendChild(apply);
            chip.appendChild(del);
            apply.addEventListener('click', () => {
                const map = valuesFromStyle(st, baseFields());
                Object.assign(values, map);
                renderFields();
                toast(t('applied'));
            });
            del.addEventListener('click', () => guarded(del, async () => {
                if (await confirm(t('confirmRemoveStyle', { name: st.name }))) {
                    removeStyle(st.id);
                    renderStyles();
                }
            }));
            stylesList.appendChild(chip);
        });
        // Append the save action and the empty-library message.
        stylesList.appendChild(saveStyleBtn);
        if (!arr.length) stylesList.appendChild(el('div', 'sjm-hint sjm-styles-hint', t('noStyles')));
    }

    function renderAll() {
        for (const k of Object.keys(values)) delete values[k];
        renderPreview();
        renderFields();
        renderStyles();
    }

    sel.addEventListener('change', () => { baseId = sel.value; renderAll(); });

    markBtn.addEventListener('click', () => guarded(markBtn, async () => {
        const start = preview.selectionStart;
        const end = preview.selectionEnd;
        if (start === end) { toast(t('needSelection'), 'warning'); return; }
        const content = promptById(baseId)?.content || '';
        if (content.slice(start, end) !== preview.value.slice(start, end)) {
            toast(t('selNotFound'), 'warning');
            return;
        }
        const tagStart = content.length - content.trimStart().length;
        const tagEnd = tagStart + openTag().length;
        if (start < tagEnd && end > tagStart) {
            toast(t('protectedTag'), 'warning');
            return;
        }
        const fields = baseFields();
        const overlaps = fields.some((field) => {
            const span = resolveField(field, content);
            return span && start < span.end && end > span.start;
        });
        if (overlaps) { toast(t('overlapField'), 'warning'); return; }
        const name = (await prompt(t('askFieldName'), ''))?.trim();
        if (!name) return;
        if (fields.some(field => field.name === name)) {
            toast(t('duplicateField'), 'warning');
            return;
        }
        fields.push(makeField(name, content, start, end));
        persist();
        renderFields();
    }));

    saveStyleBtn.addEventListener('click', () => guarded(saveStyleBtn, async () => {
        const fields = baseFields();
        if (!fields.length) { toast(t('noFields'), 'warning'); return; }
        if (hasDuplicateFieldNames(fields)) { toast(t('duplicateField'), 'warning'); return; }
        const name = (await prompt(t('askStyleName'), ''))?.trim();
        if (!name) return;
        saveStyleFromValues(name, fields, values);
        renderStyles();
    }));

    forgeBtn.addEventListener('click', () => guarded(forgeBtn, async () => {
        const base = promptById(baseId);
        if (hasDuplicateFieldNames(baseFields())) {
            toast(t('duplicateField'), 'warning');
            return;
        }
        if (!resolveFields(base?.content || '', baseFields())) {
            toast(t('staleFields'), 'warning');
            return;
        }
        const name = (await prompt(t('askName'), base?.name || ''))?.trim();
        if (!name) return;
        if (name === base?.name) { toast(t('sameAsBase'), 'warning'); return; }
        const clash = matchingNamedPrompt(name, baseId);
        const otherClash = allPrompts().find(p => p.name === name && p.identifier !== baseId && p !== clash);
        if (otherClash) { toast(t('nameInUse'), 'warning'); return; }
        if (clash && !(await confirm(t('overwrite', { name })))) return;
        try {
            const id = await createVariant(baseId, values, name);
            if (!id) { toast(t('staleFields'), 'warning'); return; }
            refreshSettingsInfo();
            toast(t('created'));
            root.dispatchEvent(new CustomEvent('sjm-done'));
        } catch (e) {
            warn('forge', e);
            toast(t('saveFailed'), 'error');
        }
    }));

    renderAll();
    return { root };
}

let popupOpen = false;
async function openPopup() {
    if (popupOpen) return;
    if (!isOai()) { toast(t('notOai'), 'warning'); return; }
    popupOpen = true;
    const c = ctx();
    try {
        const { root } = buildUI();
        const popup = new c.Popup(root, c.POPUP_TYPE.TEXT, '', {
            wide: true, large: true, allowVerticalScrolling: true,
            okButton: t('cancel'), cancelButton: false,
        });
        popup.dlg?.classList?.add('sjm-popup');
        root.addEventListener('sjm-done', () => {
            try { popup.complete(c.POPUP_RESULT.AFFIRMATIVE); } catch (e) { warn('close', e); }
        });
        await popup.show();
    } catch (e) {
        warn('popup', e);
    } finally {
        popupOpen = false;
    }
}

const PM_MARKER = NS + '-pm';
const WAND_MARKER = NS + '-wand';

function injectPmButton() {
    const footer = document.querySelector('.completion_prompt_manager_footer');
    if (!footer) return false;
    if (footer.querySelector('.' + PM_MARKER)) return true;
    const btn = el('a', `menu_button fa-solid fa-palette fa-fw sjm-trigger ${PM_MARKER}`);
    btn.title = t('openTitle');
    btn.tabIndex = 0;
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', t('openTitle'));
    btn.addEventListener('click', openPopup);
    btn.addEventListener('keydown', clickOnKey);
    const anchor = footer.querySelector('#prompt-manager-export');
    if (anchor) anchor.after(btn); else footer.appendChild(btn);
    return true;
}

// Extensions menu entry.
function injectWand() {
    const menu = document.getElementById('extensionsMenu');
    if (!menu || typeof menu.querySelector !== 'function') return false;
    if (menu.querySelector('.' + WAND_MARKER)) return true;
    const item = el('div', `list-group-item flex-container flexGap5 interactable sjm-trigger ${WAND_MARKER}`);
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.style.cursor = 'pointer';
    item.title = t('openTitle');
    item.setAttribute('aria-label', t('openTitle'));
    item.addEventListener('keydown', clickOnKey);
    item.appendChild(el('div', 'fa-solid fa-palette extensionsMenuExtensionButton'));
    item.appendChild(el('span', null, 'STYLE JAM'));
    let last = 0;
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const now = Date.now();
        if (now - last < 400) return;
        last = now;
        openPopup();
    });
    menu.appendChild(item);
    return true;
}

const SETTINGS_MARKER = NS + '-settings';
let refreshSettingsInfo = () => {};

function injectSettings() {
    const container = document.getElementById('extensions_settings');
    if (!container || typeof container.querySelector !== 'function') return false;
    if (container.querySelector('.' + SETTINGS_MARKER)) {
        refreshSettingsInfo();
        return true;
    }

    const drawer = el('div', 'inline-drawer ' + SETTINGS_MARKER);

    const toggle = el('div', 'inline-drawer-toggle inline-drawer-header');
    const contentId = NS + '-settings-content';
    toggle.tabIndex = 0;
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-label', t('title'));
    toggle.setAttribute('aria-controls', contentId);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('keydown', clickOnKey);
    toggle.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
    });
    const titleB = el('b');
    titleB.appendChild(el('span', null, '⊹ STYLE JAM ⊹'));
    toggle.appendChild(titleB);
    toggle.appendChild(el('div', 'inline-drawer-icon fa-solid fa-circle-chevron-down down'));
    drawer.appendChild(toggle);

    const content = el('div', 'inline-drawer-content');
    content.id = contentId;
    const panel = el('div', 'sjm-settings');
    panel.appendChild(el('p', 'sjm-settings-intro', t('settingsIntro')));

    const row = el('div', 'sjm-settings-row');
    const label = el('label', 'sjm-settings-label', t('tagLabel'));
    const input = el('input', 'text_pole sjm-settings-tag');
    const inputId = NS + '-tag';
    input.type = 'text';
    input.id = inputId;
    input.value = tag();
    input.placeholder = DEFAULT_TAG;
    input.setAttribute('aria-label', t('tagLabel'));
    label.htmlFor = inputId;
    const resetBtn = el('button', 'menu_button sjm-icon-btn');
    resetBtn.type = 'button';
    resetBtn.appendChild(el('i', 'fa-solid fa-undo'));
    resetBtn.title = t('reset');
    resetBtn.setAttribute('aria-label', t('reset'));
    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(resetBtn);
    panel.appendChild(row);

    const preview = el('div', 'sjm-settings-preview');
    const matches = el('div', 'sjm-hint sjm-settings-matches');
    matches.setAttribute('aria-live', 'polite');
    panel.appendChild(preview);
    panel.appendChild(matches);
    panel.appendChild(el('p', 'sjm-hint', t('tagHint')));

    refreshSettingsInfo = () => {
        preview.textContent = t('tagPreview', { tag: openTag() });
        matches.textContent = isOai() ? t('tagMatches', { n: imageGenPrompts().length }) : '';
    };

    function commit(raw) {
        const s = store();
        if (!s) return;
        s.tag = normalizeTag(raw);
        input.value = s.tag;
        persist();
        refreshSettingsInfo();
    }

    input.addEventListener('change', () => commit(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(input.value); });
    resetBtn.addEventListener('click', () => commit(DEFAULT_TAG));

    refreshSettingsInfo();
    content.appendChild(panel);
    drawer.appendChild(content);
    container.appendChild(drawer);
    return true;
}

function bothPresent() {
    return !!document.querySelector('.' + WAND_MARKER)
        && !!document.querySelector('.' + PM_MARKER)
        && !!document.querySelector('.' + SETTINGS_MARKER);
}

function tick() {
    try {
        injectWand();
        injectPmButton();
        injectSettings();
    } catch (e) { warn('inject', e); }
}

// Reinsert the footer button after Prompt Manager rerenders.
let observed = false;
let injectScheduled = false;
function scheduleInject() {
    if (injectScheduled) return;
    injectScheduled = true;
    requestAnimationFrame(() => {
        injectScheduled = false;
        injectPmButton();
    });
}
function observePm() {
    if (observed) return;
    const target = document.getElementById('completion_prompt_manager')
        || document.querySelector('.completion_prompt_manager');
    if (!target) return;
    try {
        const mo = new MutationObserver(scheduleInject);
        mo.observe(target, { childList: true, subtree: true });
        observed = true;
    } catch (e) { warn('observe', e); }
}

let booted = false;
function init() {
    tick();
    observePm();
    if (booted) return;
    booted = true;
    // Stop retries after all entry points and the observer are available.
    let tries = 0;
    const timer = setInterval(() => {
        tick();
        observePm();
        if ((bothPresent() && observed) || ++tries > 30) clearInterval(timer);
    }, 800);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
try {
    const c = ctx();
    const ev = c?.eventSource;
    const types = c?.eventTypes || c?.event_types;
    if (ev && types) {
        if (types.APP_READY) ev.on(types.APP_READY, init);
        if (types.OAI_PRESET_CHANGED_AFTER) ev.on(types.OAI_PRESET_CHANGED_AFTER, tick);
        if (types.MAIN_API_CHANGED) ev.on(types.MAIN_API_CHANGED, tick);
        if (types.PRESET_RENAMED) ev.on(types.PRESET_RENAMED, movePresetFields);
    }
} catch (e) { warn('events', e); }
