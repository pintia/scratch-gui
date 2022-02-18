/* eslint-disable no-alert */
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {submitPreviewProblems, submitProblems} from '../actions';
import config from '../config';
import Button from '../components/button/button.jsx';
import {setSaving as setSavingAction} from '../reducers/pta';
import {setProjectUnchanged as setProjectUnchangedAction} from '../reducers/project-changed';

const PtaSubmitter = ({
    projectChanged,
    saving,
    vm,
    setSaving,
    setProjectUnchanged
}) => {
    const submitProblem = () => {
        setSaving(true);
        return (config.examId === '0' ? submitPreviewProblems({
            problemSetId: config.problemSetId,
            details: [{
                problemId: '0',
                problemSetProblemId: config.problemSetProblemId,
                scratchSubmissionDetail: {answer: vm.toJSON()}
            }]
        }) : submitProblems({
            examId: config.examId,
            details: [{
                problemId: '0',
                problemSetProblemId: config.problemSetProblemId,
                scratchSubmissionDetail: {answer: vm.toJSON()}
            }]
        }))
            .then(() => {
                setSaving(false);
                setProjectUnchanged();
                window.location = `${config.PTA_URL}/problem-sets/${config.problemSetId}/problems/type/13`;
            })
            .catch(e => {
                setSaving(false);
                alert(e.message);
            });
    };

    return (
        saving ? (
            <div>{'提交中...'}</div>
        ) : (
            projectChanged ? (
                <Button
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={submitProblem}
                    style={{border: '1px solid white', padding: '8px 12px'}}
                >
                    {'提交'}
                </Button>
            ) : null
        )
    );
};

PtaSubmitter.propTypes = {
    setSaving: PropTypes.func,
    setProjectUnchanged: PropTypes.func,
    saving: PropTypes.bool,
    projectChanged: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    saving: state.scratchGui.pta.saving,
    projectChanged: state.scratchGui.projectChanged
});

const mapDispatchToProps = dispatch => ({
    setSaving: saving => dispatch(setSavingAction(saving)),
    setProjectUnchanged: () => dispatch(setProjectUnchangedAction())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PtaSubmitter);
