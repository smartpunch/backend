#!/usr/bin/env python
# coding: utf-8

# # Live classification of punch-type and hand

# import neccessary modules
from timeseries_helpers import standardizer
from timeseries_helpers import database_importer
from timeseries_helpers import dataset_importer
from timeseries_helpers import datasetstorer
import json
import pandas as pd
import numpy as np

# tsfresh modules (for feature extraction)
from tsfresh import extract_features, extract_relevant_features, select_features
from tsfresh.utilities.dataframe_functions import impute
from tsfresh.feature_extraction.settings import ComprehensiveFCParameters, MinimalFCParameters, EfficientFCParameters

# import logging
# Set logger-level to "error". Not recommed: Important warnings can be overseen
# logging.basicConfig(level=logging.ERROR)

# import machine learning algorithms
from sklearn.svm import SVC
from sklearn import svm
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import accuracy_score

import pickle
import sys

# Load from file
with open("C:/path/to/label-classification/models/pkl/file.pkl", 'rb') as file:
    model_rndm_forest_clf_punchtype = pickle.load(file)

# Load from file
with open("C:/path/to/hand-classification/models/pkl/file.pkl", 'rb') as file:
    model_rndm_forest_clf_hand = pickle.load(file)


# Read data from stdin
def read_in():
    line = sys.stdin.readline()
    if line:
        # start response msg
        # print('[py_response]')
        # print('[py]: {}'.format(line))
        data = json.loads(line)
        # print(type(data))
        return data
    else:
        return False


# continious part:
def run_classification():
    while True:
        new_punch_data = read_in()
        if new_punch_data:
            jsnDataset = new_punch_data
            
			# convert dataset to timestamps in absolute us
            ds = database_importer.jsonData_to_dataset_in_timedifference_us(
                data=jsnDataset)

            ds_new = standardizer.normate_dataset_period(2000, 1000, ds)
            ds = standardizer.change_strings_to_numbs(ds_new)
            # del ds['Unnamed: 0'] # remove the unnecessary column ... maybe this can be fixed in a later version of the dataset-exporter?!

            # converts the given list of dataframes to one dataframe
            df_list = []
            for idx, e in enumerate(ds):
                df = e.assign(punch_id=idx)
                df_list.append(df)
            df_res = pd.concat(df_list)
            df_new = df_res.reset_index(drop=True)
            df_new = df_new.rename(index=str, columns={
                "x": "a_x", "y": "a_y", "z": "a_z"})

            # try to use the minimal feature settings
            settings_minimal = MinimalFCParameters()  # only a few basic features

            # extract features for test dataset
            testds_for_extraction = df_new.drop(
                columns=['label', 'hand', 'annotator'])
            test_dataset_extracted = extract_features(testds_for_extraction, column_id="punch_id",
                                                      column_sort="timestamp", impute_function=impute, default_fc_parameters=settings_minimal)

            classified_label = model_rndm_forest_clf_punchtype.predict(
                test_dataset_extracted)

            classified_hand = model_rndm_forest_clf_hand.predict(
                test_dataset_extracted)

            print(
                '[py_end][py_predicted_label] %s [py_predicted_label][py_predicted_hand] %s [py_predicted_hand][py_end]' % (classified_label, classified_hand))


# prevends the process to start multiple times
if __name__ == '__main__':
    run_classification()
