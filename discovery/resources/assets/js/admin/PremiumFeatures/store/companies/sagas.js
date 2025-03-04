import {takeLatest} from 'redux-saga/effects';
import {sendAPIRequest} from '~/axios/api';
import * as ActionTypes from './actions';

function* saga() {
    yield takeLatest([
        ActionTypes.GET_COMPANIES
    ], sendAPIRequest);
}

export default saga;