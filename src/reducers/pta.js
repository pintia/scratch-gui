const SET_SAVING = 'pta/SET_SAVING';

const initialState = {
    saving: false
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_SAVING:
        return {
            ...state,
            saving: action.saving
        };
    default:
        return state;
    }
};

const setSaving = saving => ({
    type: SET_SAVING,
    saving
});

export {
    reducer as default,
    initialState as ptaInitialState,
    setSaving
};
