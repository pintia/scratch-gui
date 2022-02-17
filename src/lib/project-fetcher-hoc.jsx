import React from 'react';
import JSZip from 'jszip';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {
    getProblemScratchFileDownloadLink,
    getProblem,
    downloadScratchFile,
    getLastPreviewSubmissionForProblem,
    getLastSubmissionForProblem
} from '../actions';
import config from '../config';

import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    getIsCreatingNew,
    getIsFetchingWithId,
    getIsLoading,
    getIsShowingProject,
    onFetchedProjectData,
    projectError,
    setProjectId
} from '../reducers/project-state';
import {
    activateTab,
    BLOCKS_TAB_INDEX
} from '../reducers/editor-tab';

import log from './log';
import storage from './storage';

/* Higher Order Component to provide behavior for loading projects by id. If
 * there's no id, the default project is loaded.
 * @param {React.Component} WrappedComponent component to receive projectData prop
 * @returns {React.Component} component with project loading behavior
 */
const ProjectFetcherHOC = function (WrappedComponent) {
    class ProjectFetcherComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'fetchProject'
            ]);
            storage.setProjectHost(props.projectHost);
            storage.setAssetHost(props.assetHost);
            storage.setTranslatorFunction(props.intl.formatMessage);
            // props.projectId might be unset, in which case we use our default;
            // or it may be set by an even higher HOC, and passed to us.
            // Either way, we now know what the initial projectId should be, so
            // set it in the redux store.
            if (
                props.projectId !== '' &&
                props.projectId !== null &&
                typeof props.projectId !== 'undefined'
            ) {
                this.props.setProjectId(props.projectId.toString());
            }
        }
        componentDidUpdate (prevProps) {
            if (prevProps.projectHost !== this.props.projectHost) {
                storage.setProjectHost(this.props.projectHost);
            }
            if (prevProps.assetHost !== this.props.assetHost) {
                storage.setAssetHost(this.props.assetHost);
            }
            if (this.props.isFetchingWithId && !prevProps.isFetchingWithId) {
                this.fetchProject();
            }
            if (this.props.isShowingProject && !prevProps.isShowingProject) {
                this.props.onProjectUnchanged();
            }
            if (this.props.isShowingProject && (prevProps.isLoadingProject || prevProps.isCreatingNew)) {
                this.props.onActivateTab(BLOCKS_TAB_INDEX);
            }
        }
        fetchProject () {
            if (
                ((config.mode === 'view' || config.mode === 'edit') && config.problemId) ||
                (config.mode === 'exam' && config.problemSetProblemId && config.problemSetId)
            ) {
                (config.mode === 'exam' ?
                    Promise.all([
                        downloadScratchFile({
                            problemSetId: config.problemSetId,
                            problemSetProblemId: config.problemSetProblemId
                        }).then(({downloadLink}) => fetch(downloadLink))
                            .then(response => response.arrayBuffer())
                            .then(arraybuffer => JSZip.loadAsync(arraybuffer)),
                        (config.examId === '0' ? getLastPreviewSubmissionForProblem({
                            problemSetId: config.problemSetId,
                            problemSetProblemId: config.problemSetProblemId
                        }) : getLastSubmissionForProblem({
                            problemSetId: config.problemId,
                            problemSetProblemId: config.problemSetProblemId
                        })).then(({submission}) => submission?.submissionDetails?.[0]?.scratchSubmissionDetail?.answer)
                    ]).then(([zip, answer]) => {
                        if (answer) {
                            zip.file('project.json', answer);
                        }
                        return zip.generateAsync({type: 'arraybuffer'});
                    }) :
                    Promise.all([
                        getProblemScratchFileDownloadLink({problemId: config.problemId})
                            .then(({downloadLink}) => fetch(downloadLink))
                            .then(response => response.arrayBuffer())
                            .then(arraybuffer => JSZip.loadAsync(arraybuffer)),
                        getProblem({problemId: config.problemId})
                            .then(({problem}) => problem.judgeConfig.scratchJudgeConfig.answer)
                    ]).then(([zip, answer]) => {
                        zip.file('project.json', answer);
                        return zip.generateAsync({type: 'arraybuffer'});
                    })
                ).then(projectData => {
                    this.props.onFetchedProjectData(projectData, this.props.loadingState);
                }).catch(err => {
                    this.props.onError(err);
                    log.error(err);
                });
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                assetHost,
                intl,
                isLoadingProject: isLoadingProjectProp,
                loadingState,
                onActivateTab,
                onError: onErrorProp,
                onFetchedProjectData: onFetchedProjectDataProp,
                onProjectUnchanged,
                projectHost,
                projectId,
                reduxProjectId,
                setProjectId: setProjectIdProp,
                /* eslint-enable no-unused-vars */
                isFetchingWithId: isFetchingWithIdProp,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    fetchingProject={isFetchingWithIdProp}
                    {...componentProps}
                />
            );
        }
    }
    ProjectFetcherComponent.propTypes = {
        assetHost: PropTypes.string,
        canSave: PropTypes.bool,
        intl: intlShape.isRequired,
        isCreatingNew: PropTypes.bool,
        isFetchingWithId: PropTypes.bool,
        isLoadingProject: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onActivateTab: PropTypes.func,
        onError: PropTypes.func,
        onFetchedProjectData: PropTypes.func,
        onProjectUnchanged: PropTypes.func,
        projectHost: PropTypes.string,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func
    };
    ProjectFetcherComponent.defaultProps = {
        assetHost: 'https://assets.scratch.mit.edu',
        projectHost: 'https://projects.scratch.mit.edu'
    };

    const mapStateToProps = state => ({
        isCreatingNew: getIsCreatingNew(state.scratchGui.projectState.loadingState),
        isFetchingWithId: getIsFetchingWithId(state.scratchGui.projectState.loadingState),
        isLoadingProject: getIsLoading(state.scratchGui.projectState.loadingState),
        isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState),
        loadingState: state.scratchGui.projectState.loadingState,
        reduxProjectId: state.scratchGui.projectState.projectId
    });
    const mapDispatchToProps = dispatch => ({
        onActivateTab: tab => dispatch(activateTab(tab)),
        onError: error => dispatch(projectError(error)),
        onFetchedProjectData: (projectData, loadingState) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        setProjectId: projectId => dispatch(setProjectId(projectId)),
        onProjectUnchanged: () => dispatch(setProjectUnchanged())
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(ProjectFetcherComponent));
};

export {
    ProjectFetcherHOC as default
};
