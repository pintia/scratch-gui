/* eslint-disable no-alert, no-invalid-this */
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {downloadScratchFile} from '../actions';
import config from '../config';
import Button from '../components/button/button.jsx';
import {
    setProjectUnchanged as setProjectUnchangedAction
} from '../reducers/project-changed';

class PtaResetter extends React.Component{
    state = {
        resetting: false
    }

    setResetting = resetting => this.setState({resetting})

    resetProblem = () => {
        if (!confirm('将题目重置为初始状态，放弃所有更改？')) {
            return;
        }

        this.setResetting(true);
        return downloadScratchFile({
            problemSetId: config.problemSetId,
            problemSetProblemId: config.problemSetProblemId
        }).then(({downloadLink}) => fetch(downloadLink.replace(/^http:/, 'https:')))
            .then(response => response.arrayBuffer())
            .then(projectData => this.props.vm.loadProject(projectData))
            .then(() => {
                this.setResetting(false);
                this.props.setProjectUnchanged();
            })
            .catch(e => {
                this.setResetting(false);
                alert(e.message);
            });
    };

    render () {
        const {resetting} = this.state;
        return (
            resetting ? (
                <div>{'重置中...'}</div>
            ) : (
                // eslint-disable-next-line react/jsx-no-bind,react/jsx-handler-names
                <Button onClick={this.resetProblem}>{'重置'}</Button>
            )
        );
    }
}

PtaResetter.propTypes = {
    setProjectUnchanged: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    setProjectUnchanged: () => dispatch(setProjectUnchangedAction())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PtaResetter);
