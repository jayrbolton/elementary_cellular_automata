#!/bin/bash
set -e

zuul --ui mocha-qunit --local -- test/index.js
