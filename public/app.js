'use strict';

// El token yab9a fel memoire, ma nsajlouhech fel stockage navigateur.
const state = { token: null, user: null, projects: [], project: null, tasks: [], mode: 'login', editor: null };
const $ = id => document.getElementById(id);
const labels = { in_progress: 'En cours', completed: 'Terminé', paused: 'En pause', todo: 'À faire', doing: 'En cours', done: 'Terminée' };

function notice(message, error = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('error', error);
  $('notice').hidden = false;
}

// Ma n7ottouch donnees mel API fi innerHTML bech ma ysirch XSS.
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function resetSession() {
  state.token = null; state.user = null; state.project = null; state.projects = []; state.tasks = [];
  $('workspace').hidden = true; $('auth-panel').hidden = false; $('task-section').hidden = true;
  $('projects').replaceChildren(); $('tasks').replaceChildren();
  $('auth-password').value = '';
}

async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch('/api' + path, {
    method,
    headers: { ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  $('api-status').textContent = `${response.status} · ${method} /api${path}`;
  // El token ma yodhhorch fel panneau mta3 demonstration.
  $('api-output').textContent = JSON.stringify(data, (key, value) => /token|password/i.test(key) ? '[masqué]' : value, 2);
  if (!response.ok) {
    if (response.status === 401 && state.token) resetSession();
    throw new Error([data.message, ...(data.errors || [])].filter(Boolean).join(' '));
  }
  return data;
}

// Nwarriw erreurs mta3 requetes lel user w nraj3ou el boutons.
async function action(button, operation) {
  if (button?.disabled) return;
  if (button) button.disabled = true;
  try { await operation(); } catch (error) { notice(error.message || 'Connexion au serveur impossible.', true); }
  finally { if (button) button.disabled = false; }
}

function setAuthMode(mode) {
  state.mode = mode;
  $('name-field').hidden = mode !== 'register';
  $('auth-name').required = mode === 'register';
  $('auth-password').minLength = mode === 'register' ? 8 : 1;
  $('auth-password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  $('login-tab').classList.toggle('active', mode === 'login');
  $('register-tab').classList.toggle('active', mode === 'register');
  $('auth-title').textContent = mode === 'login' ? 'Retrouvez vos projets' : 'Créez votre espace';
  $('auth-submit').textContent = mode === 'login' ? 'Se connecter →' : 'Créer mon compte →';
}
$('login-tab').onclick = () => setAuthMode('login');
$('register-tab').onclick = () => setAuthMode('register');
$('auth-form').onsubmit = event => {
  event.preventDefault();
  action($('auth-submit'), async () => {
    const credentials = { login: $('auth-login').value, password: $('auth-password').value };
    if (state.mode === 'register') {
      await api('/auth/register', { method: 'POST', body: { ...credentials, name: $('auth-name').value } });
      setAuthMode('login'); $('auth-password').value = '';
      notice('Compte créé. Vous pouvez maintenant vous connecter.');
      return;
    }
    const data = await api('/auth/login', { method: 'POST', body: credentials });
    state.token = data.token; state.user = data.user;
    $('auth-password').value = '';
    $('auth-panel').hidden = true; $('workspace').hidden = false;
    $('identity').textContent = `${data.user.name} · ${data.user.role === 'manager' ? 'Manager' : 'Utilisateur'}`;
    $('permission-note').textContent = data.user.role === 'manager' ? 'Vous pouvez consulter tous les projets et affecter les tâches.' : 'Vous consultez les projets dont vous êtes propriétaire.';
    notice('Connexion réussie. Bienvenue dans votre espace.');
    await loadProjects();
  });
};
$('logout').onclick = () => { resetSession(); notice('Vous êtes déconnecté.'); };

function query(form) {
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form)) if (value.trim()) params.set(key, value.trim());
  return '?' + params.toString();
}
function pill(status) { return element('span', labels[status] || status, 'pill ' + status); }

async function loadProjects() {
  const data = await api('/projects' + query($('project-filters')));
  state.projects = data.projects;
  $('project-count').textContent = data.count;
  renderProjects();
}
function renderProjects() {
  $('projects').replaceChildren();
  if (!state.projects.length) $('projects').append(element('div', 'Aucun projet trouvé. Créez votre premier projet ou ajustez la recherche.', 'empty'));
  for (const project of state.projects) {
    const card = element('button', undefined, 'project-card' + (state.project?._id === project._id ? ' selected' : ''));
    card.type = 'button';
    card.append(pill(project.status), element('h3', project.name), element('p', (project.description || 'Aucune description.').slice(0, 140)), element('p', 'Ouvrir le projet →'));
    card.onclick = () => action(card, () => selectProject(project._id));
    $('projects').append(card);
  }
}
async function selectProject(id) {
  const data = await api('/projects/' + id);
  state.project = data.project;
  $('selected-project').textContent = data.project.name;
  $('project-description').textContent = data.project.description || 'Aucune description.';
  $('task-section').hidden = false;
  renderProjects();
  await loadTasks();
}
async function loadTasks() {
  if (!state.project) return;
  const data = await api(`/projects/${state.project._id}/tasks` + query($('task-filters')));
  state.tasks = data.tasks;
  $('task-count').textContent = data.count;
  $('done-count').textContent = data.tasks.filter(task => task.status === 'done').length;
  $('tasks').replaceChildren();
  if (!data.tasks.length) $('tasks').append(element('div', 'Aucune tâche trouvée pour ce projet.', 'empty'));
  for (const task of data.tasks) {
    const row = element('article', undefined, 'task-row');
    const info = element('div');
    info.append(element('h3', task.title), pill(task.status), element('p', task.description || 'Aucune description.'));
    info.append(element('div', `Échéance : ${task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : 'Non définie'} · Assignée : ${task.assignedTo || 'Personne'}`, 'task-meta'));
    const controls = element('div', undefined, 'button-row');
    const edit = element('button', 'Modifier', 'secondary'); edit.onclick = () => openEditor('task', task);
    const remove = element('button', 'Supprimer', 'danger');
    remove.onclick = () => {
      if (!confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
      action(remove, async () => { await api(`/projects/${state.project._id}/tasks/${task._id}`, { method: 'DELETE' }); await loadTasks(); notice('Tâche supprimée.'); });
    };
    controls.append(edit, remove); row.append(info, controls); $('tasks').append(row);
  }
}
$('project-filters').onsubmit = event => { event.preventDefault(); action(event.submitter, loadProjects); };
$('task-filters').onsubmit = event => { event.preventDefault(); action(event.submitter, loadTasks); };
$('new-project').onclick = () => openEditor('project');
$('new-task').onclick = () => openEditor('task');
$('edit-project').onclick = () => openEditor('project', state.project);
$('delete-project').onclick = () => {
  if (!state.project || !confirm(`Supprimer « ${state.project.name} » et toutes ses tâches ?`)) return;
  action($('delete-project'), async () => {
    await api('/projects/' + state.project._id, { method: 'DELETE' });
    state.project = null; state.tasks = []; $('task-section').hidden = true;
    $('task-count').textContent = '—'; $('done-count').textContent = '—';
    await loadProjects(); notice('Projet et tâches associées supprimés.');
  });
};

function openEditor(kind, item = null) {
  state.editor = { kind, item };
  const task = kind === 'task';
  $('editor-form').reset(); $('editor-error').hidden = true;
  $('editor-title').textContent = `${item ? 'Modifier' : 'Créer'} ${task ? 'une tâche' : 'un projet'}`;
  $('editor-name-label').firstChild.textContent = task ? 'Titre' : 'Nom du projet';
  $('editor-name').value = item ? (task ? item.title : item.name) : '';
  $('editor-description').value = item?.description || '';
  $('editor-status').replaceChildren();
  for (const status of (task ? ['todo', 'doing', 'done'] : ['in_progress', 'completed', 'paused'])) {
    const option = element('option', labels[status]); option.value = status; $('editor-status').append(option);
  }
  if (item) $('editor-status').value = item.status;
  $('deadline-field').hidden = !task;
  $('editor-deadline').value = item?.deadline ? item.deadline.slice(0, 10) : '';
  $('assignment-field').hidden = !task || state.user.role !== 'manager';
  $('editor-assigned').disabled = !task || state.user.role !== 'manager';
  $('editor-assigned').value = item?.assignedTo || '';
  $('editor').showModal();
}
function closeEditor() { $('editor').close(); }
$('close-editor').onclick = closeEditor;
$('cancel-editor').onclick = closeEditor;
$('editor-form').onsubmit = async event => {
  event.preventDefault();
  const button = $('save-editor');
  if (button.disabled) return;
  button.disabled = true; $('editor-error').hidden = true;
  try {
    const { kind, item } = state.editor;
    const body = { description: $('editor-description').value, status: $('editor-status').value };
    body[kind === 'task' ? 'title' : 'name'] = $('editor-name').value;
    let path = '/projects';
    if (kind === 'task') {
      path += `/${state.project._id}/tasks`;
      body.deadline = $('editor-deadline').value || null;
      if (state.user.role === 'manager') body.assignedTo = $('editor-assigned').value.trim() || null;
    }
    if (item) path += '/' + item._id;
    const data = await api(path, { method: item ? 'PATCH' : 'POST', body });
    closeEditor();
    if (kind === 'project') { await loadProjects(); await selectProject(data.project._id); }
    else await loadTasks();
    const verb = kind === 'task' ? (item ? 'modifiée' : 'créée') : (item ? 'modifié' : 'créé');
    notice(`${kind === 'task' ? 'Tâche' : 'Projet'} ${verb} avec succès.`);
  } catch (error) { $('editor-error').textContent = error.message; $('editor-error').hidden = false; }
  finally { button.disabled = false; }
};

// Health verifie HTTP, les autres routes testent aussi MongoDB.
fetch('/api/health').then(response => {
  if (!response.ok) throw new Error();
  $('health').textContent = '● API disponible';
}).catch(() => { $('health').textContent = '● API inaccessible'; });
