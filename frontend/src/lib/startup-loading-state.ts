// Deliberately not persisted: a reload gets a fresh startup, SPA navigation does not.
let finished = false;

export function isStartupLoadingFinished() {
    return finished;
}

export function finishStartupLoading() {
    finished = true;
}
