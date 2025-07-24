// Definisi graf
const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const edges = [
    { from: 'A', to: 'B', weight: 5 },
    { from: 'A', to: 'C', weight: 10 },
    { from: 'B', to: 'D', weight: 7 },
    { from: 'C', to: 'D', weight: 3 },
    { from: 'C', to: 'E', weight: 8 },
    { from: 'D', to: 'J', weight: 15 },
    { from: 'E', to: 'J', weight: 4 },
    { from: 'F', to: 'G', weight: 6 },
    { from: 'G', to: 'H', weight: 9 },
    { from: 'H', to: 'I', weight: 12 },
    { from: 'I', to: 'J', weight: 5 }
];

// Matriks adjacency
const adjacencyMatrix = {};
nodes.forEach(node => {
    adjacencyMatrix[node] = {};
    nodes.forEach(n => {
        adjacencyMatrix[node][n] = 0;
    });
});

edges.forEach(edge => {
    adjacencyMatrix[edge.from][edge.to] = edge.weight;
    adjacencyMatrix[edge.to][edge.from] = edge.weight;
});

// Fungsi untuk menampilkan/menyembunyikan menu
function showMainMenu() {
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('adj-matrix').classList.add('hidden');
    document.getElementById('graph-visual').classList.add('hidden');
    document.getElementById('dijkstra-menu').classList.add('hidden');
}

function showAdjMatrix() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('adj-matrix').classList.remove('hidden');
    renderAdjacencyMatrix();
}

function showGraph() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('graph-visual').classList.remove('hidden');
    renderGraph();
    renderAdjacencyList();
}

function showDijkstra() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('dijkstra-menu').classList.remove('hidden');
    clearDijkstraResult();
}

function backToMain() {
    showMainMenu();
}

// Render matriks adjacency
function renderAdjacencyMatrix() {
    const table = document.getElementById('adjacency-table');
    table.innerHTML = '';
    
    // Header row
    let headerRow = document.createElement('tr');
    let emptyHeader = document.createElement('th');
    emptyHeader.className = 'border p-2';
    headerRow.appendChild(emptyHeader);
    
    nodes.forEach(node => {
        let th = document.createElement('th');
        th.className = 'border p-2 bg-gray-100';
        th.textContent = node;
        headerRow.appendChild(th);
    });
    
    table.appendChild(headerRow);
    
    // Data rows
    nodes.forEach(from => {
        let row = document.createElement('tr');
        
        let rowHeader = document.createElement('th');
        rowHeader.className = 'border p-2 bg-gray-100';
        rowHeader.textContent = from;
        row.appendChild(rowHeader);
        
        nodes.forEach(to => {
            let cell = document.createElement('td');
            cell.className = 'border p-2 text-center';
            cell.textContent = adjacencyMatrix[from][to] || '0';
            row.appendChild(cell);
        });
        
        table.appendChild(row);
    });
}

// Render visual graf
function renderGraph(containerId = 'graph-canvas') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Positions for nodes (simplified circular layout)
    const positions = {};
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 30;
    
    nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        positions[node] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });
    
    // Draw edges
    edges.forEach(edge => {
        const fromPos = positions[edge.from];
        const toPos = positions[edge.to];
        
        const edgeEl = document.createElement('div');
        edgeEl.className = 'edge';
        
        // Calculate edge length and angle
        const length = Math.sqrt(
            Math.pow(toPos.x - fromPos.x, 2) + 
            Math.pow(toPos.y - fromPos.y, 2)
        );
        
        const angle = Math.atan2(
            toPos.y - fromPos.y, 
            toPos.x - fromPos.x
        ) * 180 / Math.PI;
        
        edgeEl.style.width = `${length}px`;
        edgeEl.style.left = `${fromPos.x}px`;
        edgeEl.style.top = `${fromPos.y}px`;
        edgeEl.style.transform = `rotate(${angle}deg)`;
        
        // Add weight label
        const labelEl = document.createElement('div');
        labelEl.className = 'edge-label';
        labelEl.textContent = edge.weight;
        labelEl.style.left = `${fromPos.x + (toPos.x - fromPos.x)/2 - 10}px`;
        labelEl.style.top = `${fromPos.y + (toPos.y - fromPos.y)/2 - 10}px`;
        
        container.appendChild(edgeEl);
        container.appendChild(labelEl);
    });
    
    // Draw nodes
    nodes.forEach(node => {
        const pos = positions[node];
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.textContent = node;
        nodeEl.style.left = `${pos.x - 20}px`;
        nodeEl.style.top = `${pos.y - 20}px`;
        container.appendChild(nodeEl);
    });
}

// Render adjacency list
function renderAdjacencyList() {
    const listContainer = document.getElementById('adjacency-list');
    listContainer.innerHTML = '';
    
    let html = '<div class="bg-gray-50 p-4 rounded-lg"><h3 class="font-bold mb-2">Daftar Adjacency:</h3>';
    
    nodes.forEach(node => {
        html += `<div class="mb-2"><span class="font-bold">${node}</span> → `;
        
        const connections = edges
            .filter(edge => edge.from === node || edge.to === node)
            .map(edge => edge.from === node ? edge.to : edge.from);
        
        const connectedNodes = connections.map(conn => {
            const weight = adjacencyMatrix[node][conn];
            return `<span class="bg-white px-2 py-1 rounded mx-1 shadow-sm">${conn} (${weight})</span>`;
        }).join('');
        
        html += connectedNodes + '</div>';
    });
    
    html += '</div>';
    listContainer.innerHTML = html;
}

// Dijkstra's algorithm implementation
function dijkstra(startNode, endNode) {
    const distances = {};
    const previousNodes = {};
    const visited = new Set();
    const queue = new PriorityQueue();
    
    // Initialize distances
    nodes.forEach(node => {
        distances[node] = node === startNode ? 0 : Infinity;
        previousNodes[node] = null;
    });
    
    queue.enqueue(startNode, 0);
    
    while (!queue.isEmpty()) {
        const currentNode = queue.dequeue().element;
        
        if (currentNode === endNode) {
            break;
        }
        
        if (visited.has(currentNode)) {
            continue;
        }
        
        visited.add(currentNode);
        
        // Update distances for neighbors
        nodes.forEach(neighbor => {
            if (adjacencyMatrix[currentNode][neighbor] > 0) {
                const newDistance = distances[currentNode] + adjacencyMatrix[currentNode][neighbor];
                
                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                    previousNodes[neighbor] = currentNode;
                    queue.enqueue(neighbor, newDistance);
                }
            }
        });
    }
    
    return { distances, previousNodes };
}

// Helper class for priority queue used in Dijkstra
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(element, priority) {
        const qElement = { element, priority };
        let inserted = false;
        
        for (let i = 0; i < this.items.length; i++) {
            if (qElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, qElement);
                inserted = true;
                break;
            }
        }
        
        if (!inserted) {
            this.items.push(qElement);
        }
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
}

// Function to reconstruct path from Dijkstra results
function getPath(previousNodes, startNode, endNode) {
    const path = [];
    let currentNode = endNode;
    
    while (currentNode !== null) {
        path.unshift(currentNode);
        currentNode = previousNodes[currentNode];
    }
    
    return path.length > 0 && path[0] === startNode ? path : [];
}

// Function to highlight path in the graph
function highlightPath(path, containerId = 'dijkstra-graph') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    renderGraph(containerId);
    
    // Highlight nodes in path
    const positions = {};
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 30;
    
    nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        positions[node] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });
    
    // Highlight edges in path
    for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i+1];
        
        const fromPos = positions[from];
        const toPos = positions[to];
        
        const edgeEl = document.querySelectorAll('#dijkstra-graph .edge');
        const edgeLabels = document.querySelectorAll('#dijkstra-grapph .edge-label');
        
        edgeEl.forEach(el => {
            const style = window.getComputedStyle(el);
            const angle1 = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
            const angle2 = Math.atan2(
                parseInt(style.top) + parseInt(style.height) / 2 - fromPos.y,
                parseInt(style.left) + parseInt(style.width) - fromPos.x
            );
            
            if (Math.abs(angle1 - angle2) < 0.1) {
                el.style.background = '#ef4444';
                el.style.height = '3px';
                el.style.zIndex = '10';
            }
        });
        
        edgeLabels.forEach(el => {
            if (el.textContent == adjacencyMatrix[from][to]) {
                el.style.color = '#ef4444';
                el.style.fontWeight = 'bold';
            }
        });
    }
    
    // Highlight nodes in path
    path.forEach(node => {
        const pos = positions[node];
        const nodes = document.querySelectorAll(`#dijkstra-graph .node`);
        
        nodes.forEach(n => {
            if (n.textContent === node) {
                n.style.background = '#ef4444';
                n.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.3)';
                n.style.zIndex = '20';
            }
        });
    });
}

// Run Dijkstra algorithm and display results
function runDijkstra() {
    const startNode = document.getElementById('start-node').value;
    const endNode = document.getElementById('end-node').value;
    
    if (startNode === endNode) {
        alert('Titik asal dan tujuan tidak boleh sama!');
        return;
    }
    
    const { distances, previousNodes } = dijkstra(startNode, endNode);
    const path = getPath(previousNodes, startNode, endNode);
    
    // Display results
    const resultContainer = document.getElementById('dijkstra-result');
    resultContainer.classList.remove('hidden');
    
    const pathResult = document.getElementById('path-result');
    const distanceResult = document.getElementById('distance-result');
    
    if (path.length === 0) {
        pathResult.innerHTML = `Tidak ada jalur dari ${startNode} ke ${endNode}`;
        distanceResult.innerHTML = '';
    } else {
        pathResult.innerHTML = `<span class="font-medium">Jalur:</span> ${path.join(' → ')}`;
        distanceResult.innerHTML = `<span class="font-medium">Total jarak:</span> ${distances[endNode]}`;
        
        // Highlight path in graph
        highlightPath(path);
    }
}

// Clear Dijkstra result
function clearDijkstraResult() {
    document.getElementById('dijkstra-result').classList.add('hidden');
    document.getElementById('path-result').innerHTML = '';
    document.getElementById('distance-result').innerHTML = '';
}

// Initialize
showMainMenu();
