import React from 'react';
import './App.css';
import logo from './EcoFreshX.png';
import QrReader from 'react-qr-reader';
import axios from 'axios';

import {
  Navbar, Button, Spinner
} from 'react-bootstrap';

const style = {width: '100%'};

interface Item {
  itemType: string;
  datePlanted: Date;
  dateHarvested: Date;
}

interface State {
  state: 'scanning' | 'loading' | 'displaying' | 'error';
  selectedId: string | null;
  loadedItem: Item | null;
  error: string | null;
}

const loadItems = async (qrCode: string): Promise<Item | null> => {
  try {
    const result = await axios.get(`https://ecofreshwebapi.azurewebsites.net/consumer/item/${qrCode}`);
    if (result.status === 200) {
      return {
        itemType: String(result.data.itemType),
        datePlanted: new Date(result.data.datePlanted + ' 00:00'),
        dateHarvested: new Date(result.data.dateHarvested + ' 00:00'),
      };
    }
  }
  catch {}
  return null;
};

class App extends React.Component<{}, State> {
  public constructor(props: {}) {
    super(props);
    const selectedId = window.location.search;
    console.log(selectedId);
    if (selectedId) {
      this.state = {
        state: 'loading',
        selectedId: selectedId.substr(1),
        loadedItem: null,
        error: null,
      };
      loadItems(selectedId.substr(1)).then(this.handleLoaded);
    } else {
      this.state = {
        state: 'scanning',
        selectedId: null,
        loadedItem: null,
        error: null,
      };
    }
  }

  handleError = (error: any) => {
    console.log(error);
  };

  handleLoaded = (item: Item | null) => {
    if (item) {
      this.setState({
        state: 'displaying',
        loadedItem: item,
      });
    } else {
      this.setState({
        state: 'error',
        error: 'not found',
      });
    }
  };

  handleScan = async (selectedId: string | null) => {
    if (!selectedId) { return; }
    if (selectedId.includes('?')) {
      selectedId = selectedId.split('?')[1];
    }
    this.setState({
      state: 'loading',
      selectedId,
      loadedItem: null,
    });
    const item = await loadItems(selectedId);
    this.handleLoaded(item);
  };

  startScanning = () => {
    this.setState({
      state: 'scanning',
      selectedId: null,
      loadedItem: null,
    });
  };

  public render(): JSX.Element {
    const map = {
      scanning: () => <QrReader 
        delay={300}
        onScan={this.handleScan}
        onError={this.handleError}
        style={style}
      />,
      loading: () => <div style={{display:'flex', justifyContent:'center'}}><Spinner animation='border'/></div>,
      displaying: () => <div>
        item {this.state.selectedId}<br/>
        {this.state.loadedItem!.itemType && <>type: {this.state.loadedItem!.itemType}<br/></>}
        {this.state.loadedItem!.dateHarvested && <>harvested on {this.state.loadedItem!.dateHarvested.toDateString()}<br/></>}
        {this.state.loadedItem!.datePlanted && <>planted on {this.state.loadedItem!.datePlanted.toDateString()}<br/></>}
        <Button onClick={this.startScanning}>Scan Again</Button>
      </div>,
      error: () => <div>
        Could not find item {this.state.selectedId}<br/>
        <Button onClick={this.startScanning}>Scan Again</Button>
      </div>
    };
    const Child = map[this.state.state];
    return <>
      <Navbar bg='primary'>
        <img src={logo} alt='Ecofresh' style={{width:'100%'}}/>
      </Navbar>
      <Child/>
    </>;
  }
}

export default App;
