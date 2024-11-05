import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'

function NodeView({x=0,y=0,label="a",onMouseDown}) {
	return (
		<div 
			className="node"
			style={{
				left: `${x}px`,	
				top: `${y}px`,
			}}
			onMouseDown={onMouseDown}
		>
			{label}
		</div>	
	)
}

function LinkView({x1=0,y1=0,x2=10,y2=10,r=20}) {
	const hypot = Math.hypot(x2-x1,y2-y1)
	if(hypot < 2*r) {
		return (<></>)
	}
	const cx = (x2-x1)/hypot
	const cy = (y2-y1)/hypot
	x1 += r*cx
	y1 += r*cy
	x2 -= r*cx
	y2 -= r*cy
	return (
		<line 
			x1={x1} y1={y1} 
			x2={x2} y2={y2} 
			stroke="white" 
			strokeWidth="2px" 
		/>
	)
}

function getAdjacencyLists(nodes,links) {
	const inLists = new Map(Array.from(nodes.keys(), key => [key,[]]))
	const outLists = new Map(Array.from(nodes.keys(), key => [key,[]]))
	for(const [key,link] of links) {
		outLists.get(link.a).push(link.b)
		inLists.get(link.b).push(link.a)
	}
	return [inLists,outLists]
}

// assumes a directed acyclic graph
function getLayers(inLists, outLists, root) {
	const counters = new Map(Array.from(inLists.keys(), key => [key,0]))
	const layers = new Map()

	// BFS
	let stack = [[root,false],[root,true]]
	while(stack.length > 0) {
		const newStack = []
		while(stack.length > 0) {
			const [node,foward] = stack.pop()
			const list = (foward ? outLists : inLists).get(node)
			for(const otherNode of list) {
				const counter = counters.get(otherNode)
				if(counter == 0) {
					newStack.push([otherNode,foward])
				}
				counters.set(otherNode,counter+1)
			}
		}
		stack = newStack
	}

	// topological sorting
	layers.set(root,0)
	stack = [[root,false],[root,true]]
	while(stack.length > 0) {
		const newStack = []
		while(stack.length > 0) {
			const [node,foward] = stack.pop()
			const list = (foward ? outLists : inLists).get(node)
			for(const otherNode of list) {
				const counter = counters.get(otherNode)
				if(counter == 1) {
					layers.set(otherNode,layers.get(node)+(foward ? 1 : -1))
					newStack.push([otherNode,foward])
				}
				counters.set(otherNode,counter-1)
			}
		}
		stack = newStack
	}

	return layers
}

function GraphView({nodes, links, root}) {

	const [inLists, outLists] = useMemo(() => getAdjacencyLists(nodes,links), [nodes, links])
	const layers = useMemo(() => getLayers(inLists, outLists, root), [inLists, outLists, root])

	const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const [positions, setPositions] = useState(new Map(
		Array.from(nodes.keys(), key => [key,{x:Math.random()*10, y:Math.random()*10}])
	)) 

	const animationRequest = useRef() 
	const animationTime = useRef() 

	const mouseMoveListener = useRef()
	const mouseLeaveListener = useRef()
	const mouseUpListener = useRef()

	const mouseDown = useRef(false)
	const dragStart = useRef()

	const alphaNode = useRef()
	const alphaStart = useRef()

	const NodeViews = Array.from(nodes, ([key,node],_) => {
		const pos = positions.get(key)
		const x = pos.x-origin.x, y = pos.y-origin.y
		const handleMouseDownAlpha = (e) => {
			e.preventDefault()
			alphaNode.current = key	
			alphaStart.current = { x: pos.x-e.clientX, y: pos.y-e.clientY }
		}
		return (
			<NodeView 
				key={key} 
				x={x} 
				y={y} 
				label={`${node.label}(${layers.get(key)})`} 
				onMouseDown={handleMouseDownAlpha}
			/>
		)
	})

	const LinkViews = Array.from(links, ([key,link],_) => {
		const pos1 = positions.get(link.a)
		const pos2 = positions.get(link.b)
		const x1 = pos1.x-origin.x, y1 = pos1.y-origin.y
		const x2 = pos2.x-origin.x, y2 = pos2.y-origin.y
		return (
			<LinkView key={key} x1={x1} y1={y1} x2={x2} y2={y2} r={50} />
		)
	})

	const update = () => { 
		setPositions(positions => { 

			const velocities = new Map(
				Array.from(nodes, ([key,node],id) => [key,{x:0, y:0}])
			) 

			const linkStrength = 1

			const radialLength = 50
			const radialStrength = 10

			const layerStart = 600
			const layerSeparation = 200
			const layerStrength = 5

			// link force
			for(const [key,link] of links) {
				const pos1 = positions.get(link.a), pos2 = positions.get(link.b)
				const dist = pos2.y-pos1.y
				const speed = dist*linkStrength 
				const velocity1 = velocities.get(link.a)
				const velocity2 = velocities.get(link.b)
				velocity1.y += speed
				velocity2.y -= speed
			}

			// radial force
			for(const [key1,pos1] of positions) {
				for(const [key2,pos2] of positions) {
					if(key1 < key2) {
						const x1 = pos1.x, y1 = pos1.y
						const x2 = pos2.x, y2 = pos2.y
						const hypot = Math.hypot(x2-x1,y2-y1)
						const cx = hypot == 0 ? 0.5 : (x2-x1)/hypot
						const cy = hypot == 0 ? 0.5 : (y2-y1)/hypot
						const speed = Math.min(hypot-radialLength,0)*radialStrength 
						const velocity1 = velocities.get(key1)
						const velocity2 = velocities.get(key2)
						velocity1.x += speed*cx
						velocity1.y += speed*cy
						velocity2.x -= speed*cx
						velocity2.y -= speed*cy
					}
				}
			}

			// layer force
			for(const [key,pos] of positions) {
				const layerX = layers.get(key)*layerSeparation+layerStart
				const distance = layerX-pos.x
				const speed = distance*layerStrength 
				const velocity = velocities.get(key)
				velocity.x += speed
			}

			return new Map(Array.from(positions, ([key,position],_) => {
				if(mouseDown.current && key == alphaNode.current) {
					return [key, {x:position.x, y:position.y}]
				}
				const velocity = velocities.get(key)
				return [key, {x:position.x + velocity.x/100, y:position.y + velocity.y/100}]
			}))
		})
		animationRequest.current = requestAnimationFrame(update) 
	}

	const handleMouseDown = (e) => {
		console.log("mouse down")
		mouseDown.current = true
		dragStart.current = { x: origin.x+e.clientX, y: origin.y+e.clientY }
	}

	const handleMouseMove = (e) => {
		if(mouseDown.current) {
			const alpha = alphaNode.current // alphaNode.current can change
			if(alpha == undefined) {
				setOrigin({ x: dragStart.current.x-e.clientX, y: dragStart.current.y-e.clientY })
			}
			else {
				setPositions(positions => {
					const newPositions = new Map(positions)
					const alphaX = alphaStart.current.x+e.clientX
					const alphaY = alphaStart.current.y+e.clientY
					newPositions.set(alpha,{x:alphaX,y:alphaY})
					return newPositions
				})
			}
		}
	}

	const handleMouseLeave = (e) => {
		mouseDown.current = false
		alphaNode.current = undefined
	}

	const handleMouseUp = (e) => {
		mouseDown.current = false
		alphaNode.current = undefined
	}

	useEffect(() => {
		animationRequest.current = requestAnimationFrame(update)
		mouseMoveListener.current = addEventListener("mousemove", handleMouseMove)
		mouseLeaveListener.current = addEventListener("mouseleave", handleMouseLeave)
		mouseUpListener.current = addEventListener("mouseup", handleMouseUp)
		return () => {
			cancelAnimationFrame(animationRequest.current)
			removeEventListener("mousemove", mouseMoveListener.current)
			removeEventListener("mouseleave", mouseLeaveListener.current)
			removeEventListener("mouseup", mouseUpListener.current)
		}
	}, [])

  return (
    <div 
			className="graph"
			onMouseDown={handleMouseDown}
			style={mouseDown.current ? {cursor:"grabbing"} : {}}
		>
			<svg className="link-nest" >
				<rect x="0" y="0" width="100000" height="100000" strokeWidth="0" fill="#112" />
				{LinkViews}
			</svg>
			<div className="node-nest">
				{NodeViews}
			</div>
    </div>
  )
}

function App() {
	const nodes = new Map([
		["n1",{label:"1"}],
		["n2",{label:"2"}],
		["n3",{label:"3"}],
		["n4",{label:"4"}],
		["n5",{label:"5"}],
		["n6",{label:"6"}],
	])
	const links = new Map([
		["l1",{a:"n1", b:"n2"}],
		["l2",{a:"n1", b:"n3"}],
		["l3",{a:"n4", b:"n1"}],
		["l4",{a:"n5", b:"n4"}],
		["l5",{a:"n6", b:"n1"}],
		["l6",{a:"n5", b:"n6"}],
	])
	return (
		<GraphView nodes={nodes} links={links} root={"n1"} />
	)
}

export default App
