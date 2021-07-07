import * as React from 'react';
import joystream from './joystream.svg';
import './App.css';
import { getValidatorStatistics, getChainState } from './get-status';
import { Box, Button, Container, Grid, LinearProgress, LinearProgressProps, TextField, Typography, withStyles } from '@material-ui/core';
import { DataGrid, ColDef } from '@material-ui/data-grid';
import { ActiveEra } from './joyApi';

interface IProps {
}

interface IState {
  shouldStop: boolean,
  rows: ActiveEra[],
  columns: ColDef[],
  stash: string,
  startBlock: number,
  endBlock: number,
  isLoading: boolean,
  lastBlock: number,
  currentBlock: number,
  timerId?: NodeJS.Timeout,
  progress: {
    value: number,
    min: number,
    max: number,
  }
}

class App extends React.Component<IProps, IState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      shouldStop: false,
      rows: [],
      columns: [
        { field: 'era', headerName: 'Era', width: 100, sortable: true, headerAlign: 'center' },
        { field: 'block', headerName: 'Block', width: 100, sortable: true, headerAlign: 'center' },
        { field: 'date', headerName: 'Date', width: 200, sortable: true, headerAlign: 'center' },
        { field: 'points', headerName: 'Points', width: 100, sortable: true, headerAlign: 'center' },
        { field: 'hash', headerName: 'Block Hash', width: 500, sortable: false, headerAlign: 'center' },
      ],
      stash: '5EhDdcWm4TdqKp1ew1PqtSpoAELmjbZZLm5E34aFoVYkXdRW',
      startBlock: 1069639,
      endBlock: 1270177,
      isLoading: false,
      lastBlock: 0,
      currentBlock: 0,
      progress: {
        value: 0,
        min: 0,
        max: 0
      }
    };
    this.getStatus = this.getStatus.bind(this);
    this.setStash = this.setStash.bind(this);
    this.setBlockStart = this.setBlockStart.bind(this);
    this.setBlockEnd = this.setBlockEnd.bind(this);
  }

  async componentDidMount() {
    const timerId = setInterval(
      () => this.updateLastBlock(),
      7000
    );
    this.setState((prevState) => {return {...prevState, timerId}})
  }

  componentWillUnmount() {
    if (this.state.timerId) {
      clearInterval(this.state.timerId);
    }
  }

  async updateLastBlock() {
      const chainState = await getChainState();
      this.setState((prevState) => {
        return { ...prevState, lastBlock: chainState.finalizedBlockHeight }
      });
  }

  setStash(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState((prevState) => {
      return { ...prevState, stash: event.target.value }
    });
  }

  setBlockStart(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState((prevState) => {
      return { ...prevState, startBlock: (event.target.value as unknown as number)}
    });
  }

  setBlockEnd(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState((prevState) => {
      return { ...prevState, endBlock: (event.target.value as unknown as number) }
    });
  }

  async getStatus() {
    const stash = this.state.stash;
    const startBlock = this.state.startBlock;
    const endBlock = this.state.endBlock;
    const isLoading = this.state.isLoading
    if (isLoading) {
      this.setState((prevState) => {
        return { ...prevState, shouldStop: true, isLoading: false }
      });
      return
    }
    
    this.setState((prevState) => {return { ...prevState, isLoading: true, rows: [] }});

    if (startBlock < endBlock) {
      for (let blockHeight = startBlock; blockHeight <= endBlock; blockHeight += 1) {
        if (this.state.shouldStop) {
          this.setState((prevState) => {
            return { ...prevState, shouldStop: false, progress: {value: 0, min: 0, max: 0} }
          });
          break;
        }
        this.setState((prevState) => {
          return { ...prevState, progress: {value: blockHeight, min: startBlock, max: endBlock} }
        });
        let result = await getValidatorStatistics(stash, blockHeight);
        if (result && result.status && this.state.rows.indexOf(result.status) < 0) {
          this.setState((prevState) => {
            return { ...prevState, rows: [...this.state.rows, result.status] }
          });
          if (blockHeight === endBlock) {
            this.setState((prevState) => {
              return { ...prevState,  isLoading: false}
            });
          }
        }
      }
    } else {
      for (let blockHeight = startBlock; blockHeight >= endBlock; blockHeight -= 1) {
        if (this.state.shouldStop) {
          this.setState((prevState) => {
            return { ...prevState, shouldStop: false, progress: {value: 0, min: 0, max: 0} }
          });
          break;
        }
        this.setState((prevState) => {
          return { ...prevState, progress: {value: blockHeight, min: startBlock, max: endBlock} }
        });
        let result = await getValidatorStatistics(stash, blockHeight);
        if (result && result.status && this.state.rows.indexOf(result.status) < 0) {
          this.setState((prevState) => {
            return { ...prevState, rows: [...this.state.rows, result.status] }
          });
          if (blockHeight === endBlock) {
            this.setState((prevState) => {
              return { ...prevState,  isLoading: false}
            });
          }
        }
      }
    }
  }

  render() {
    return (
      <div className="App" >
        <Container maxWidth="lg">
          <Grid
            container
            direction="column"
            justify="center"
            alignItems="center"
            spacing={3}
          >
            <Grid container item lg={12}></Grid>
            <img src={joystream} className="App-logo" alt="Joystream logo" />
            <Grid container item lg={12}>
              <TextField onChange={this.setStash} fullWidth id="stash" label="Stash" value={this.state.stash} variant="filled" />
            </Grid>
            <Grid container item lg={12}>
              <TextField onChange={this.setBlockStart} fullWidth id="block-start" label="Start Block" value={this.state.startBlock} variant="filled" />
            </Grid>
            <Grid container item lg={12}>
              <TextField onChange={this.setBlockEnd} fullWidth id="block-end" label={this.state.lastBlock > 0 ? `End Block (Last block: ${this.state.lastBlock})` : 'End Block'} value={this.state.endBlock} variant="filled" />
            </Grid>
            <Grid container item lg={12}>
              <BootstrapButton fullWidth onClick={this.getStatus} color="primary">{this.state.isLoading ? 'Stop loading' : 'Load data'}</BootstrapButton>
            </Grid>
            {LinearProgressWithLabel(this.state.progress)}
            <div style={{ height: 600, width: '98%' }}>
              <DataGrid rows={this.state.rows} columns={this.state.columns} pageSize={50} />
            </div>
          </Grid>
        </Container>
      </div>
    );
  }
}

export default App;

function normalise(value: number, min: number, max: number) {
  return (value - min) * 100 / (max - min);
}

function LinearProgressWithLabel(props: LinearProgressProps & { value: number, min: number, max: number }) {
  return props.value > 0 ? (
    <Grid container item lg={12}>
    <div style={{ width: '98%' }}>
      <Box display="flex" alignItems="center">
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" value={normalise(props.value, props.min, props.max)} />
        </Box>
        <Box minWidth={35} style={{whiteSpace: "nowrap"}}>
          <Typography variant="body2" color="textSecondary">
            {`${Math.round(normalise(props.value, props.min, props.max))}% (${props.value}/${props.max})`}
          </Typography>
        </Box>
      </Box>
    </div>
    </Grid>
  ) : null;
}

const BootstrapButton = withStyles({
  root: {
    boxShadow: 'none',
    textTransform: 'none',
    fontSize: 16,
    padding: '6px 12px',
    border: '1px solid',
    lineHeight: 1.5,
    color: '#ffffff',
    backgroundColor: '#0063cc',
    borderColor: '#0063cc',
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    '&:hover': {
      backgroundColor: '#0069d9',
      borderColor: '#0062cc',
      boxShadow: 'none',
    },
    '&:active': {
      boxShadow: 'none',
      backgroundColor: '#0062cc',
      borderColor: '#005cbf',
    },
    '&:focus': {
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.5)',
    },
  },
})(Button);