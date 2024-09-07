import { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './App.css';

function Pixel({ id, color, onClick, onMouseEnter }) {
  const style = {
    backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 100})`,
  };
  return (
    <div
      className="pixel"
      id={id}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    ></div>
  );
}

function Row({ rowIndex, columns, pixelMatrix, handlePixelClick, handleMouseEnter }) {
  const pixels = [];
  for (let j = 0; j < columns; j++) {
    const id = `${rowIndex}-${j}`;
    const color = pixelMatrix[rowIndex][j];
    pixels.push(
      <Pixel
        key={id}
        id={id}
        color={color}
        onClick={() => handlePixelClick(rowIndex, j)}
        onMouseEnter={() => handleMouseEnter(rowIndex, j)}
      />
    );
  }
  return <div className="row">{pixels}</div>;
}

function App() {
  const [rows, setRows] = useState([]);
  const [isScreenLoaded, setScreenIsLoaded] = useState(false);
  const [currentColor, setCurrentColor] = useState([0, 0, 0, 100]);
  const [objectName, setObjectName] = useState('');
  const [gridWidth, setGridWidth] = useState(16);
  const [gridHeight, setGridHeight] = useState(16);
  const [pixelMatrix, setPixelMatrix] = useState([]);
  const [resultMatrix, setResultMatrix] = useState([]);
  const [formattedText, setFormattedText] = useState('');
  const [hoveredCoordinate, setHoveredCoordinate] = useState(null);
  const [recentColors, setRecentColors] = useState([]);
  const [tool, setTool] = useState('brush');
  const [inputArray, setInputArray] = useState('');
  const [savedColor, setSavedColor] = useState('');
  const [firstPoint, setFirstPoint] = useState('');
  const [secondPoint, setSecondPoint] = useState('')

  function handleKeyDown(event) {
    switch (event.key) {
      case 'e':
        setTool('eraser');
        setSavedColor(currentColor)
        setCurrentColor([100, 100, 100, 100]);
        break;
      case 'b':
        if (savedColor != '') {
          setCurrentColor(savedColor)
        }
        setTool('brush');
        break;
      case 'i':
        setTool('eyedropper');
        break;
      case 'r':
        setTool('rectangle');
      default:
        break;
    }
  }

  useEffect(() => {
    if (!isScreenLoaded) {
      loadScreen(gridWidth, gridHeight);
      setScreenIsLoaded(true);
      window.addEventListener("keydown", handleKeyDown);
    }
  }, [isScreenLoaded, gridWidth, gridHeight]);

  useEffect(() => {
    if (pixelMatrix.length > 0) {
      createRows(pixelMatrix, gridWidth, gridHeight);
    }
  }, [pixelMatrix]);

  useEffect(() => {
    const savedColors = localStorage.getItem('recentColors');
    if (savedColors) {
      setRecentColors(JSON.parse(savedColors));
    }
  }, []);

  const loadScreen = (width, height) => {
    const initialMatrix = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => [100, 100, 100, 100])
    );
    setPixelMatrix(initialMatrix);
  };

  const createRows = (matrix, width, height) => {
    const rowsArray = [];
    for (let i = 0; i < height; i++) {
      rowsArray.push(
        <Row
          key={i}
          rowIndex={i}
          columns={width}
          pixelMatrix={matrix}
          handlePixelClick={handlePixelClick}
          handleMouseEnter={handleMouseEnter}
        />
      );
    }
    setRows(rowsArray);
  };

  const handlePixelClick = (x, y) => {
    setPixelMatrix((prevMatrix) => {
      const newMatrix = prevMatrix.map((row, rowIndex) =>
        row.map((pixel, colIndex) => {
          if (rowIndex === x && colIndex === y) {
            if (tool === 'eraser') {
              return [100, 100, 100, 100];
            } else if (tool === 'eyedropper') {
              setCurrentColor(pixel);
              setTool('brush');
              return pixel;
            } else {
              return currentColor;
            }
          } else {
            return pixel;
          }
        })
      );
      return newMatrix;
    });
  };

  const handleMouseEnter = (x, y) => {
    setHoveredCoordinate([x, y]);
  };

  const handleStart = () => {
    setScreenIsLoaded(false);
    setRows([]);
  };

  const handleFinish = () => {
    const newMatrix = pixelMatrix.map(row =>
      row.map(pixel =>
        pixel[0] === 100 && pixel[1] === 100 && pixel[2] === 100 && pixel[3] === 100
          ? [0, 0, 0, 0]
          : [...pixel]
      )
    );
    setResultMatrix(newMatrix);
    const formatted = `const ${objectName}Icon = ${JSON.stringify(newMatrix)};\n\nexport default ${objectName}Icon;`;
    setFormattedText(formatted);
  };

  const hexToRgb = (hex) => {
    if (hex.length !== 7 || hex[0] !== '#') return [0, 0, 0, 0];
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b, 100];
  };

  const handleColorPick = (e) => {
    const hexColor = e.target.value;
    const rgbColor = hexToRgb(hexColor);
    setCurrentColor(rgbColor);
  };

  const handleSaveColor = () => {
    updateRecentColors(currentColor);
  };

  const updateRecentColors = (newColor) => {
    const updatedColors = [newColor, ...recentColors].slice(0, 10);
    setRecentColors(updatedColors);
    localStorage.setItem('recentColors', JSON.stringify(updatedColors));
  };

  const handleRecentColorClick = (color) => {
    setCurrentColor(color);
  };

  const handleClearLastColor = () => {
    if (recentColors.length > 0) {
      const updatedColors = recentColors.slice(1);
      setRecentColors(updatedColors);
      localStorage.setItem('recentColors', JSON.stringify(updatedColors));
    }
  };

  const handleGridSizeChange = (width, height) => {
    setGridWidth(width);
    setGridHeight(height);
    setScreenIsLoaded(false);
  };

  const handleLoadArray = () => {
    try {
      const loadedArray = JSON.parse(inputArray);

      const maxWidth = Math.max(loadedArray[0].length, gridWidth);
      const maxHeight = Math.max(loadedArray.length, gridHeight);

      const newMatrix = Array.from({ length: maxHeight }, (_, rowIndex) =>
        Array.from({ length: maxWidth }, (_, colIndex) => {
          const pixel = loadedArray[rowIndex]?.[colIndex] || [100, 100, 100, 100];
          return pixel[3] === 0 ? [100, 100, 100, 100] : pixel;
        })
      );

      setGridWidth(maxWidth);
      setGridHeight(maxHeight);
      setPixelMatrix(newMatrix);
      setScreenIsLoaded(true);
    } catch (error) {
      alert("Invalid array format. Please enter a valid JSON array.");
    }
  };

  return (
    <div className="blackCover">
      <div className="topMenu">
        <input
          type="text"
          className="name"
          placeholder='Имя проекта'
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
        />
        <button onClick={handleStart}>Начать!</button>
        <button onClick={handleFinish}>Завершить</button>
      </div>
      <div className="optionsCover">
      <div className="gridSizeOptions">
        <button
          onClick={() => handleGridSizeChange(8, 8)}
          className={gridWidth === 8 && gridHeight === 8 ? 'active' : ''}
        >
          8х8
        </button>
        <button
          onClick={() => handleGridSizeChange(16, 16)}
          className={gridWidth === 16 && gridHeight === 16 ? 'active' : ''}
        >
          16х16
        </button>
        <button
          onClick={() => handleGridSizeChange(32, 32)}
          className={gridWidth === 32 && gridHeight === 32 ? 'active' : ''}
        >
          32х32
        </button>
        <button
          onClick={() => handleGridSizeChange(64, 64)}
          className={gridWidth === 64 && gridHeight === 64 ? 'active' : ''}
        >
          64х64
        </button>
      </div>
      <div className="gridSizeOptions">
        <input
          className="sizeInput"
          type="number"
          placeholder="Ширина"
          value={gridWidth}
          onChange={(e) => setGridWidth(Number(e.target.value))}
        />
        <input
          className="sizeInput"
          type="number"
          placeholder="Высота"
          value={gridHeight}
          onChange={(e) => setGridHeight(Number(e.target.value))}
        />
        <button
          className="setSizeButton"
          onClick={() => handleGridSizeChange(gridWidth, gridHeight)}
        >
          Задать размеры
        </button>
      </div>
      </div>
      <div className="arrInputSec">
        <input
          placeholder="Введите массив пикселей"
          value={inputArray}
          onChange={(e) => setInputArray(e.target.value)}
          className="inputArrayText"
        ></input>
        <button onClick={handleLoadArray} className="loadArrayButton">Загрузить</button>
      </div>      
      <div className="paintZone">
      <div className="screen">
        {rows}
        {hoveredCoordinate && (
        <div className="coordinates">
          Координаты: [{hoveredCoordinate[0] + 1}, {hoveredCoordinate[1] + 1}]
        </div>
      )}
      </div>
      <div className="colorfunctions">
              <div className="colorOptions">
        <input type="color" onChange={handleColorPick} className="colorpicker" />
        <button onClick={handleSaveColor} className="saveColorButton">Сохранить цвет</button>
        <button
          onClick={handleClearLastColor}
          className="clearLastColorButton"
          disabled={recentColors.length === 0}
        >
          Очистить
        </button>
      </div>
      {recentColors.length > 0 ? <div className="recentColors">
        {recentColors.map((color, index) => (
        <div
          key={index}
          className="recentColor"
          onClick={() => handleRecentColorClick(color)}
        >
          <div
            className="colorBox"
            style={{ backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 100})` }}
          ></div>
          <span>{`[${color[0]}, ${color[1]}, ${color[2]}]`}</span>
        </div>
        ))}
      </div> : <></>}
      </div>

      </div>
      {
        formattedText != '' ? <div className="result">
        <CopyToClipboard text={formattedText}>
          <button>Скопировать</button>
        </CopyToClipboard>
        <p>{formattedText}</p>
      </div> : <></>
      }
    </div>
  );
}

export default App;
