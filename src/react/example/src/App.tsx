import { ContextValue } from '../../ContextValue';
import { State } from '../../State';
import { StateButton } from '../../StateButton';
import './App.css';
import { styled } from './stiches.config';

const Container = styled('div', {
  margin: '0 auto',
  height: '100%',
  '@bp3': {
    width: '1024px',
  },
});

const Title = styled('h1', {
  fontSize: '2rem',
  fontWeight: 'bold',
  margin: '2rem 0',
  padding: '0',
});

const Heading = styled('h2', {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  margin: '0.5rem 0',
  padding: '0',
});

const Box = styled('div', {
  padding: '1rem',
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  marginTop: '0.5rem',
  marginBottom: '0.5rem',
});

const Button = styled(StateButton, {
  padding: '0.5rem 1rem',
  backgroundColor: '#f2f2f2',
  color: 'black',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#e2e2e2',
  },
  marginRight: '0.5rem',
  marginLeft: '0.5rem',
});

const Paragraph = styled('p', {
  marginTop: '1rem',
  marginBottom: '1rem',
});

function App() {
  return (
    <Container>
      <Title>Traffic Light</Title>

      <State id="root">
        <State
          id="alpha"
          initial
          context={{ count: 999 }}
          on={{
            GO_BETA: () => 'beta',
          }}
        >
          <Box>
            <Heading>Alpha</Heading>
            Value from context: <ContextValue get="count" />
            <Paragraph>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
              quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Quisquam, quos.
            </Paragraph>
            <Button event={{ type: 'GO_BETA' }}>Goto Beta</Button>
            <State id="alpha-1" initial>
              <Box>
                <Heading>Alpha 1</Heading>
                <Paragraph>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Quisquam, quos. Lorem ipsum dolor sit amet consectetur
                  adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet
                  consectetur adipisicing elit. Quisquam, quos.
                </Paragraph>
              </Box>
            </State>
            <State id="alpha-2">
              <Box>
                <Heading>Alpha 2</Heading>
                <Paragraph>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Quisquam, quos. Lorem ipsum dolor sit amet consectetur
                  adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet
                  consectetur adipisicing elit. Quisquam, quos.
                </Paragraph>
              </Box>
            </State>
          </Box>
        </State>
        <State id="beta" on={{ GO_ALPHA: () => 'alpha' }}>
          <Box>
            <Heading>Beta</Heading>
            <Paragraph>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
              quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Quisquam, quos.
            </Paragraph>
            <Button event={{ type: 'GO_ALPHA' }}>Goto Alpha</Button>
          </Box>
        </State>
      </State>
    </Container>
  );
}

export default App;
