/* eslint-disable no-alert */
import {connect} from 'react-redux';
import JSZip from 'jszip';
import {head, values} from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {getProblem, updateProblem, uploadFile} from '../actions';
import config from '../config';
import Button from '../components/button/button.jsx';

import {
    setSaving as setSavingAction
} from '../reducers/pta';

import {
    setProjectUnchanged as setProjectUnchangedAction
} from '../reducers/project-changed';

const PtaSaver = ({
    projectChanged,
    saving,
    vm,
    setSaving,
    setProjectUnchanged
}) => {
    const saveProject = () => {
        setSaving(true);
        const problemId = config.problemId;
        const projectJSON = vm.toJSON();
        const project = JSON.parse(projectJSON);
        const target = project.targets.find(({isStage}) => !isStage);
        if (!target) {
            return alert('至少要有一个角色');
        }
        const comment = head(values(target.comments));
        if (!comment) {
            return alert('请添加题面描述');
        }
        const content = comment.text.trim();
        if (!content) {
            return alert('题面描述不可为空');
        }
        Promise.all([
            vm.saveProjectSb3()
                .then(blob => JSZip.loadAsync(blob))
                .then(zip => {
                    zip.file('project.json', JSON.stringify({
                        ...project,
                        targets: project.targets.map(t => (t === target ? {...t, blocks: {}} : t))
                    }));
                    return zip.generateAsync({
                        type: 'blob',
                        mimeType: 'application/x.scratch.sb3',
                        compression: 'DEFLATE',
                        compressionOptions: {
                            level: 6 // Tradeoff between best speed (1) and best compression (9)
                        }
                    });
                }),
            getProblem({problemId})
        ]).then(([blob, {problem}]) => uploadFile({blob})
            .then(({path}) => updateProblem({
                problemId,
                problem: {
                    ...problem,
                    raw: content,
                    content,
                    problemConfig: {
                        ...problem.problemConfig,
                        scratchProblemConfig: {
                            projectFile: path,
                            spriteName: project.targets.find(({isStage}) => !isStage).name
                        }
                    },
                    judgeConfig: {
                        ...problem.judgeConfig,
                        scratchJudgeConfig: {
                            answer: projectJSON
                        }
                    }
                }
            }))
        )
            .then(() => {
                setSaving(false);
                setProjectUnchanged();
            })
            .catch(e => {
                setSaving(false);
                alert(e.message);
            });
    };

    return (
        saving ? (
            <div>{'保存中...'}</div>
        ) : (
            projectChanged ? (
                // eslint-disable-next-line react/jsx-no-bind
                <Button onClick={saveProject}>{'保存'}</Button>
            ) : null
        )
    );
};

PtaSaver.propTypes = {
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
)(PtaSaver);
